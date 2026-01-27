import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductVariantDocument = ProductVariant & Document;

@Schema({ timestamps: true })
export class ProductVariant {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  attributes: {
    color?: string;
    size?: string;
    model?: string;
    [key: string]: any;
  };

  @Prop({ required: true, default: 0 })
  costPrice: number;

  @Prop({ required: true, default: 0 })
  salePrice: number;

  @Prop({ default: true })
  active: boolean;

  @Prop()
  sku?: string; // Stock Keeping Unit
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);
ProductVariantSchema.index({ productId: 1 });
ProductVariantSchema.index({ sku: 1 }, { unique: true, sparse: true });


