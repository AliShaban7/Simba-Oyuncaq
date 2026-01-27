import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupplierDocument = Supplier & Document;

@Schema({ timestamps: true })
export class Supplier {
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
  balance: number; // Calculated from ledger (negative = we owe them)

  @Prop({ default: true })
  active: boolean;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
SupplierSchema.index({ phone: 1 });
SupplierSchema.index({ name: 'text' });


