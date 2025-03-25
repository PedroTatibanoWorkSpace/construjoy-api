export class CreateReceivableDto {
  clientId: string;
  value: number;
  description: string;
  purchaseDate: Date;
  validate: Date;
}
