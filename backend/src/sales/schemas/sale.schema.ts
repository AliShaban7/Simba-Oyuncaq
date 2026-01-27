import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SaleDocument = Sale & Document;

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  MIXED = 'mixed',
}

export enum SaleStatus {
  COMPLETED = 'completed',
  VOIDED = 'voided',
  RETURNED = 'returned',
}

@Schema({ timestamps: true })
export class SaleItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ default: 0 })
  discount: number; // Amount or percentage

  @Prop({ required: true })
  total: number;
}

@Schema({ timestamps: true })
export class Sale {
  @Prop({ required: true, unique: true })
  saleNo: string; // Format: SALE-YYYYMMDD-00001

  @Prop({ type: Types.ObjectId, ref: 'Location', required: true })
  locationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  cashierId: Types.ObjectId;

  @Prop({ type: [SaleItem], required: true })
  items: SaleItem[];

  @Prop({ required: true, default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ required: true, default: 0 })
  total: number;

  @Prop({ required: true, enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({ type: Object })
  paymentBreakdown?: {
    cash?: number;
    card?: number;
    transfer?: number;
  };

  @Prop({ type: Types.ObjectId, ref: 'Customer' })
  customerId?: Types.ObjectId;

  @Prop({ default: 0 })
  paidAmount: number; // For credit sales

  @Prop({ default: 0 })
  remainingDebt: number; // For credit sales

  @Prop({ required: true, enum: SaleStatus, default: SaleStatus.COMPLETED })
  status: SaleStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  voidedBy?: Types.ObjectId;

  @Prop()
  voidReason?: string;

  @Prop()
  note?: string;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
SaleSchema.index({ saleNo: 1 });
SaleSchema.index({ createdAt: -1 });
SaleSchema.index({ cashierId: 1, createdAt: -1 });
SaleSchema.index({ locationId: 1, createdAt: -1 });
SaleSchema.index({ customerId: 1 });


