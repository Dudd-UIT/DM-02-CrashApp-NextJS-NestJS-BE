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
import { Public } from '@/decorator/customDecorator';
import { CreateAuthDto } from './dto/create-auth.dto';
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
  async handleLogin(@Request() req) {
    console.log('request.user1', req.user);
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  register(@Body() registerDto: CreateAuthDto) {
    return this.authService.handleRegister(registerDto);
  }

  @Get('mail')
  @Public()
  testMail() {
    this.mailerService.sendMail({
      to: 'danhdudoan999@gmail.com',
      subject: 'Testing Nest MailerModule ✔',
      text: 'welcome',
      html: '<b>hello</b>',
    });
    return 'ok';
  }
}
