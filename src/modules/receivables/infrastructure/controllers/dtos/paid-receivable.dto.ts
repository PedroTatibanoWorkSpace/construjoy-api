import { Type } from "class-transformer";
import { IsDate, IsString } from "class-validator";

export class PaidReceivableDto{

    id: string;

    @Type(()=> Date)
    @IsDate({message:"Tem que ser uma data"})
    paymentDate: Date;
}