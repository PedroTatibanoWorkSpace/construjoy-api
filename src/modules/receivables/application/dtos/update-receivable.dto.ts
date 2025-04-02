export class UpdateReceivableDto {
  clientId?: string;
  value?: number;
  description?: string;
  validate?: Date;
  paymentStatus? : string;
  paymentDate?: Date;
}
