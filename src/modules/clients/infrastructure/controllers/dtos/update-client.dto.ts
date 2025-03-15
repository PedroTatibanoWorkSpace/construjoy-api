import { IsEmail, IsString, Matches } from 'class-validator';

export class UpdateClientDto {
  @IsEmail()
  email?: string;
  @IsString()
  name?: string;
  @Matches(/^\(55\) \d{2} \d{5}-\d{4}$/, {
    message: 'Numero de telefone deve ter o formato (55) XX XXXXX-XXXX',
  })
  phone?: string;
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'Documento deve ter o formato de cpf XXX.XXX.XXX-XX',
  })
  document?: string;
}
