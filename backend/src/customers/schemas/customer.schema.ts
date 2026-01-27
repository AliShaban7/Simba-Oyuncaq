import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true })
  name: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop()
  address?: string;

  @Prop()
  notes?: string;

  @Prop({ default: 0 })
  balance: number; // Calculated from ledger

  @Prop({ default: true })
  active: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ name: 'text' });


