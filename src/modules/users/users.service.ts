import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { hashPasswordHelper } from '@/helpers/util';
import aqp from 'api-query-params';
import { v4 as uuid4 } from 'uuid';
import * as dayjs from 'dayjs';
import {
  ChangePasswordDto,
  CodeDto,
  CreateAuthDto,
} from '@/auth/dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly mailerService: MailerService,
  ) {}

  async isEmailExist(email: string) {
    const user = await this.userModel.exists({ email });
    if (user) return true;
    return false;
  }

  async create(createUserDto: CreateUserDto) {
    const { name, email, password, phone, address, image } = createUserDto;

    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(`Email đã tồn tại: ${email}`);
    }

    const hashPassword = await hashPasswordHelper(password);
    const user = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      phone,
      address,
      image,
    });
    console.log('hashPassword', hashPassword);
    return {
      _id: user._id,
    };
  }

  async findAll(query: string, current: number, pageSize: number) {
    const { filter, sort } = aqp(query);
    if (!current) current = 1;
    if (!pageSize) pageSize = 10;
    delete filter.current;
    delete filter.pageSize;

    const totalItems = await this.userModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (current - 1) * pageSize;

    const results = await this.userModel
      .find(filter)
      .limit(pageSize)
      .skip(skip)
      .select('-password')
      .sort(sort as any);

    return {
      meta: {
        current,
        pageSize,
        pages: totalPages,
        total: totalItems,
      },
      results,
    };
  }

  async findOneById(_id: string) {
    return await this.userModel.findOne({ _id });
  }

  async findOneByEmail(email: string) {
    const a = await this.userModel.findOne({ email });
    console.log('>>>a', a);
    return a;
  }

  async update(updateUserDto: UpdateUserDto) {
    return await this.userModel.updateOne(
      { _id: updateUserDto._id },
      { ...updateUserDto },
    );
  }

  remove(_id: string) {
    if (mongoose.isValidObjectId(_id)) {
      return this.userModel.deleteOne({ _id });
    } else {
      throw new BadRequestException('id không đúng định dạng mongodb');
    }
  }

  async handleRegister(registerDto: CreateAuthDto) {
    const { name, email, password } = registerDto;

    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(`Email đã tồn tại: ${email}`);
    }

    const hashPassword = await hashPasswordHelper(password);
    const codeId = uuid4();

    const user = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      codeId: codeId,
      codeExpired: dayjs().add(1, 'minute'),
    });

    this.mailerService.sendMail({
      to: user.email, // list of receivers
      subject: 'MR.BUOI Activation code', // Subject line
      text: 'welcome', // plaintext body
      template: 'register',
      context: {
        name: user?.name ?? user.email,
        activationCode: codeId,
      },
    });

    return {
      _id: user._id,
    };
  }

  async handleCheckCode(codeDto: CodeDto) {
    const user = await this.userModel.findOne({
      _id: codeDto.id,
      codeId: codeDto.code,
    });
    if (!user) {
      throw new BadRequestException('Mã code không hợp lệ');
    }
    const isBeforeExpired = dayjs().isBefore(user?.codeExpired);
    if (isBeforeExpired) {
      await this.userModel.updateOne({ _id: codeDto.id }, { isActive: true });
      return { isBeforeExpired };
    } else {
      throw new BadRequestException('Mã code đã hết hạn');
    }
  }

  async handleRetryActive(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }
    if (user.isActive) {
      throw new BadRequestException('Tài khoản đã được kích hoạt');
    }
    const codeId = uuid4();
    await this.userModel.updateOne(
      { _id: user._id },
      { codeId: codeId, codeExpired: dayjs().add(1, 'minute') },
    );
    this.mailerService.sendMail({
      to: user.email, // list of receivers
      subject: 'MR.BUOI Activation code', // Subject line
      text: 'welcome', // plaintext body
      template: 'register',
      context: {
        name: user?.name ?? user.email,
        activationCode: codeId,
      },
    });
    return { _id: user._id };
  }

  async handleRetryPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    const codeId = uuid4();
    await this.userModel.updateOne(
      { _id: user._id },
      { codeId: codeId, codeExpired: dayjs().add(1, 'minute') },
    );
    this.mailerService.sendMail({
      to: user.email, // list of receivers
      subject: 'MR.BUOI Change password code', // Subject line
      text: 'welcome', // plaintext body
      template: 'register',
      context: {
        name: user?.name ?? user.email,
        activationCode: codeId,
      },
    });
    return { _id: user._id, email: user.email };
  }

  async handleChangePassword(changePasswordDto: ChangePasswordDto) {
    if (changePasswordDto.password !== changePasswordDto.confirmPassword) {
      throw new BadRequestException(
        'Mật khẩu mới không đồng nhất với mật khẩu xác nhận',
      );
    }
    const user = await this.userModel.findOne({
      email: changePasswordDto.email,
    });
    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    const isBeforeExpired = dayjs().isBefore(user?.codeExpired);
    if (isBeforeExpired) {
      const newPassword = await hashPasswordHelper(changePasswordDto.password);
      await this.userModel.updateOne(
        { _id: user.id },
        { password: newPassword },
      );
      return { isBeforeExpired };
    } else {
      throw new BadRequestException('Mã code đã hết hạn');
    }
  }
}
