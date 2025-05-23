import { IsEmail, IsString, Matches, IsNotEmpty} from 'class-validator';

export class CreateClientDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  name: string;
  @Matches(/^\(55\) \d{2} \d{5}-\d{4}$/, {
    message: 'Numero de telefone deve ter o formato (55) XX XXXXX-XXXX',
  })
  @IsNotEmpty()
  phone: string;
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'Documento deve ter o formato de cpf XXX.XXX.XXX-XX',
  })
  @IsNotEmpty()
  document: string;
}
