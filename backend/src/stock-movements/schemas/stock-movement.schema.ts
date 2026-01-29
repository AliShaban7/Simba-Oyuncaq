import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StockMovementDocument = StockMovement & Document;

export enum MovementType {
  PURCHASE_IN = 'PURCHASE_IN',
  SALE_OUT = 'SALE_OUT',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  RETURN_IN = 'RETURN_IN',
  ADJUSTMENT = 'ADJUSTMENT',
}

@Schema({ timestamps: true })
export class StockMovement {
  @Prop({ type: Types.ObjectId, ref: 'ProductVariant', required: true })
  productId: Types.ObjectId; // Actually stores variantId now

  @Prop({ type: Types.ObjectId, ref: 'Location', required: true })
  locationId: Types.ObjectId;

  @Prop({ required: true })
  qty: number; // Positive for IN, negative for OUT

  @Prop({ required: true, enum: MovementType })
  type: MovementType;

  @Prop()
  refType?: string; // e.g., 'sale', 'transfer', 'purchase'

  @Prop({ type: Types.ObjectId })
  refId?: Types.ObjectId; // Reference to sale, transfer, etc.

  @Prop()
  note?: string;

  @Prop()
  costPrice?: number; // For tracking purchase cost in receipts

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop()
  transferId?: string; // For linking TRANSFER_OUT and TRANSFER_IN
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);
StockMovementSchema.index({ productId: 1, locationId: 1 });
StockMovementSchema.index({ createdAt: -1 });
StockMovementSchema.index({ refId: 1, refType: 1 });
StockMovementSchema.index({ transferId: 1 });

