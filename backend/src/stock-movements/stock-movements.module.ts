import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockMovementsService } from './stock-movements.service';
import { StockMovementsController } from './stock-movements.controller';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { StockMovement, StockMovementSchema } from './schemas/stock-movement.schema';
import { StockBalance, StockBalanceSchema } from './schemas/stock-balance.schema';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: StockBalance.name, schema: StockBalanceSchema },
    ]),
    AuditLogsModule,
  ],
  controllers: [StockMovementsController, StockController],
  providers: [StockMovementsService, StockService],
  exports: [StockMovementsService, StockService],
})
export class StockMovementsModule { }


