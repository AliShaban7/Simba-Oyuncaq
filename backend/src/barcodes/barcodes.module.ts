import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BarcodesService } from './barcodes.service';
import { BarcodesController } from './barcodes.controller';
import { Barcode, BarcodeSchema } from './schemas/barcode.schema';
import { CountersModule } from '../counters/counters.module';
import { ProductVariantsModule } from '../product-variants/product-variants.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Barcode.name, schema: BarcodeSchema }]),
    CountersModule,
    ProductVariantsModule,
    AuditLogsModule,
  ],
  controllers: [BarcodesController],
  providers: [BarcodesService],
  exports: [BarcodesService],
})
export class BarcodesModule {}


