export class CreateReceivableDto {
  userId: string;
  clientId: string;
  value: number;
  description: string;
  validate: Date;
  paymentDate: Date;
}
