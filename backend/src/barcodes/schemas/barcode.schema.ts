import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BarcodeDocument = Barcode & Document;

export enum BarcodeType {
  EAN13 = 'EAN13',
  UPC = 'UPC',
  CODE128 = 'CODE128',
  INTERNAL = 'INTERNAL',
}

@Schema({ timestamps: true })
export class Barcode {
  @Prop({ required: true, unique: true })
  value: string;

  @Prop({ required: true, enum: BarcodeType })
  type: BarcodeType;

  @Prop({ type: Types.ObjectId, ref: 'ProductVariant', required: true })
  variantId: Types.ObjectId;

  @Prop({ default: false })
  isPrimary: boolean; // Primary barcode for this variant

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const BarcodeSchema = SchemaFactory.createForClass(Barcode);
BarcodeSchema.index({ value: 1 }, { unique: true });
BarcodeSchema.index({ variantId: 1 });
BarcodeSchema.index({ variantId: 1, isPrimary: 1 });


