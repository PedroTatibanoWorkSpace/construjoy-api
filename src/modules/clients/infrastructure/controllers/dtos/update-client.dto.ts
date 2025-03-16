import { IsEmail, IsString, Matches, IsOptional } from 'class-validator';

export class UpdateClientDto {

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @Matches(/^\(55\) \d{2} \d{5}-\d{4}$/, {
    message: 'Numero de telefone deve ter o formato (55) XX XXXXX-XXXX',
  })
  @IsOptional()
  phone?: string;
  
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'Documento deve ter o formato de cpf XXX.XXX.XXX-XX',
  })
  @IsOptional()
  document?: string;
}
