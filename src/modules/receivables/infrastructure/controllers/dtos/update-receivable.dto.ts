import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateReceivableDto {
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
  @Type(() => Date)
  @IsDate()
  validate?: Date;
  
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  purchaseDate: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paymentDate?: Date;
}
