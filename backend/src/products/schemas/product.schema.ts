import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop()
  category?: string;

  @Prop()
  brand?: string;

  @Prop()
  description?: string;

  @Prop({ required: true, default: 0 })
  costPrice: number;

  @Prop({ required: true, default: 0 })
  salePrice: number;

  @Prop({ default: true })
  active: boolean;

  @Prop({ unique: true, sparse: true })
  barcode?: string;

  @Prop()
  ean?: string; // External EAN barcode

  @Prop({ type: Object })
  variants?: {
    size?: string;
    color?: string;
    [key: string]: any;
  };
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ barcode: 1 });
ProductSchema.index({ name: 'text', description: 'text' });


