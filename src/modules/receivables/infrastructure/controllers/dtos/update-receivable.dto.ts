import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class UpdateReceivableDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  installmentNumber?: number;

  @IsOptional()
  @IsDate()
  validate?: Date;

  @IsOptional()
  @IsDate()
  paymentDate?: Date;
}
