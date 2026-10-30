import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreditCheckDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsNumber()
  @IsPositive()
  value: number;
}
