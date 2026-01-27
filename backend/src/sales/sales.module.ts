import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale, SaleSchema } from './schemas/sale.schema';
import { CashClosing, CashClosingSchema } from './schemas/cash-closing.schema';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { LedgerModule } from '../ledger/ledger.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: CashClosing.name, schema: CashClosingSchema },
    ]),
    StockMovementsModule,
    LedgerModule,
    AuditLogsModule,
    ProductsModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}


