export class CreateReceivableDto {
  userId: string;
  clientId: string;
  value: number;
  description: string;
  installmentNumber: number;
  validate: Date;
  paymentDate: Date;
}
