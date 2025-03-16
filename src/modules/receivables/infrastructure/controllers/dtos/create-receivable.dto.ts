import { IsString, IsNumber, IsDate } from 'class-validator';

export class CreateReceivableDto {
  @IsString()
  userId: string;

  @IsString()
  clientId: string;

  @IsNumber()
  value: number;

  @IsString()
  description: string;

  @IsNumber()
  installmentNumber: number;

  @IsDate()
  validate: Date;

  @IsDate()
  paymentDate: Date;
}
