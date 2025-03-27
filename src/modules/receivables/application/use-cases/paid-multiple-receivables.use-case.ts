import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { Receivable } from "src/modules/receivables/domain/entities/receivable.entity";
import { PaidMultipleReceivablesDto } from "../dtos/paid-multiple-receivables.dto";
import { ReceivableRepositoryPort } from "../../domain/ports/receivable-repository.port";

@Injectable()
export class PaidMultipleReceivablesUseCase {
    constructor(
        @Inject('ReceivableRepositoryPort')
        private readonly receivableRepository: ReceivableRepositoryPort,
    ) {}
    
    async execute(paidMultipleReceivablesDto: PaidMultipleReceivablesDto): Promise<Receivable[]> {
        const { initialDate, finishDate, clientId, paymentDate } = paidMultipleReceivablesDto;

        const receivables = await this.receivableRepository.findAll({
            id_client: clientId,
            purchaseDate: {
                gte: initialDate,
                lte: finishDate
            },
            paymentStatus: 'Pendente' 
        });
        
        if (receivables.length === 0) {
            throw new NotFoundException('Nenhuma conta a receber encontrada para este período');
        }
        
        const updatedReceivables = await Promise.all(
            receivables.map(async (receivable) => {
                receivable.update({
                    paymentStatus: 'Pago',
                    paymentDate: paymentDate
                });
                
                return this.receivableRepository.update(receivable.id, receivable);
            })
        );
        
        return updatedReceivables;
    }
}