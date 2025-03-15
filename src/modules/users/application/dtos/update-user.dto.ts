import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
}
