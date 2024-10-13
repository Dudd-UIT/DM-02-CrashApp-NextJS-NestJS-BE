import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAuthDto {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  name: string;
}

export class CodeDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  code: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  code: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  confirmPassword: string;

  @IsNotEmpty()
  email: string;
}
