import { IsString, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReceivableDto {
  @IsString()
  clientId: string;

  @IsNumber()
  value: number;

  @IsString()
  description: string;

  @Type(() => Date)
  @IsDate()
  validate: Date;

  @Type(() => Date)
  @IsDate()
  purchaseDate: Date;
}
