import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CashClosingDocument = CashClosing & Document;

@Schema({ timestamps: true })
export class CashClosing {
  @Prop({ type: Types.ObjectId, ref: 'Location', required: true })
  locationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  expectedCash: number;

  @Prop({ required: true })
  countedCash: number;

  @Prop({ required: true })
  difference: number;

  @Prop({ required: true })
  differenceReason: string;

  @Prop()
  note?: string;
}

export const CashClosingSchema = SchemaFactory.createForClass(CashClosing);
CashClosingSchema.index({ locationId: 1, date: -1 });
CashClosingSchema.index({ userId: 1, date: -1 });


