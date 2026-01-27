import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StockBalanceDocument = StockBalance & Document;

@Schema({ timestamps: true })
export class StockBalance {
  @Prop({ type: Types.ObjectId, ref: 'ProductVariant', required: true })
  productId: Types.ObjectId; // Actually stores variantId now

  @Prop({ type: Types.ObjectId, ref: 'Location', required: true })
  locationId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  quantity: number;

  @Prop()
  lastMovementAt?: Date;
}

export const StockBalanceSchema = SchemaFactory.createForClass(StockBalance);
StockBalanceSchema.index({ productId: 1, locationId: 1 }, { unique: true });

