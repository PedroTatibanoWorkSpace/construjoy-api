import { IsNumber, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  value: number;

  @IsString()
  paymentMethod: string;

  @IsString()
  idReceivable: string;
}
