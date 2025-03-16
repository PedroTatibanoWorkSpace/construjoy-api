import { IsEmail, IsString, IsOptional } from 'class-validator';

export class UpdateUserDto {

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
  
}
