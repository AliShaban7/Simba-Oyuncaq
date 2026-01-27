import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { LocationsModule } from './locations/locations.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { SalesModule } from './sales/sales.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { LedgerModule } from './ledger/ledger.module';
import { ReportsModule } from './reports/reports.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ProductVariantsModule } from './product-variants/product-variants.module';
import { BarcodesModule } from './barcodes/barcodes.module';
import { CountersModule } from './counters/counters.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/simba-oyuncaq'),
    AuthModule,
    UsersModule,
    ProductsModule,
    LocationsModule,
    StockMovementsModule,
    SalesModule,
    CustomersModule,
    SuppliersModule,
    LedgerModule,
    ReportsModule,
    AuditLogsModule,
    ProductVariantsModule,
    BarcodesModule,
    CountersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

