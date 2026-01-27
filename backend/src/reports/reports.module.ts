import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { SalesModule } from '../sales/sales.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [StockMovementsModule, SalesModule, CustomersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}


