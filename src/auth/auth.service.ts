import { Injectable } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { comparePasswordHelper } from '@/helpers/util';
import { JwtService } from '@nestjs/jwt';
import { CodeDto, CreateAuthDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.findOneByEmail(username);
    if (!user) {
      return null;
    }
    const isValid = await comparePasswordHelper(pass, user.password);
    if (!isValid) {
      return null;
    }
    const { password, ...result } = user.toObject();
    console.log('result', result);
    return result;
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user._id };
    return {
      user: {
        email: user.email,
        _id: user._id,
        name: user.name,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async handleRegister(registerDto: CreateAuthDto) {
    return await this.userService.handleRegister(registerDto);
  }

  async checkCode(codeDto: CodeDto) {
    return await this.userService.handleCheckCode(codeDto);
  }

  async retryActive(email: string) {
    return await this.userService.handleRetryActive(email);
  }
}
