import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

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
  @Type(() => Date)
  @IsDate()
  validate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paymentDate?: Date;
}
