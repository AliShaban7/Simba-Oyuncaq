import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LedgerEntryDocument = LedgerEntry & Document;

export enum PartyType {
  CUSTOMER = 'customer',
  SUPPLIER = 'supplier',
}

export enum LedgerEntryType {
  SALE_ON_CREDIT = 'sale_on_credit',
  PAYMENT = 'payment',
  PURCHASE_ON_CREDIT = 'purchase_on_credit',
  REFUND = 'refund',
}

@Schema({ timestamps: true })
export class LedgerEntry {
  @Prop({ required: true, enum: PartyType })
  partyType: PartyType;

  @Prop({ type: Types.ObjectId, required: true })
  partyId: Types.ObjectId;

  @Prop({ required: true })
  amount: number; // Positive = they owe us, Negative = we owe them

  @Prop({ required: true, default: 'AZN' })
  currency: string;

  @Prop({ required: true, enum: LedgerEntryType })
  type: LedgerEntryType;

  @Prop()
  refId?: string;

  @Prop()
  refType?: string;

  @Prop()
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const LedgerEntrySchema = SchemaFactory.createForClass(LedgerEntry);
LedgerEntrySchema.index({ partyType: 1, partyId: 1, createdAt: -1 });
LedgerEntrySchema.index({ refId: 1, refType: 1 });


