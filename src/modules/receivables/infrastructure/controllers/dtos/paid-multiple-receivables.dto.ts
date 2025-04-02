import { IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaidMultipleReceivablesDto {

  @Type(() => Date)
  @IsNotEmpty()
  initialDate: Date;

  @Type(() => Date)
  @IsNotEmpty()
  finishDate: Date;

  @Type(() => Date)
  @IsNotEmpty()
  paymentDate: Date;

  clientId: string;
}
