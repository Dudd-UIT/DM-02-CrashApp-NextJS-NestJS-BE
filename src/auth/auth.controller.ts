import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './passport/local/local-auth.guard';
import { JwtAuthGuard } from './passport/jwt/jwt-auth.guard';
import { Public, ResponseMessage } from '@/decorator/customDecorator';
import {
  ChangePasswordDto,
  CodeDto,
  CreateAuthDto,
} from './dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailerService: MailerService,
  ) {}

  @Public()
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ResponseMessage('Fetch login')
  async handleLogin(@Request() req) {
    console.log('request.user1', req.user);
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  register(@Body() registerDto: CreateAuthDto) {
    return this.authService.handleRegister(registerDto);
  }

  @Public()
  @Post('check-code')
  checkCode(@Body() codeDto: CodeDto) {
    return this.authService.checkCode(codeDto);
  }

  @Public()
  @Post('retry-active')
  retryActive(@Body('email') email: string) {
    console.log(email);
    return this.authService.retryActive(email);
  }

  @Public()
  @Post('retry-password')
  retryPassword(@Body('email') email: string) {
    console.log(email);
    return this.authService.retryPassword(email);
  }

  @Public()
  @Post('change-password')
  changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(changePasswordDto);
  }

  @Get('mail')
  @Public()
  testMail() {
    this.mailerService.sendMail({
      to: 'danhdudoan999@gmail.com', // list of receivers
      subject: 'Testing Nest MailerModule ✔', // Subject line
      text: 'welcome', // plaintext body
      template: 'register',
      context: {
        name: 'Eric',
        activationCode: 123456789,
      },
    });
    return 'ok';
  }
}
