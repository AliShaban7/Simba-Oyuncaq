import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LocationDocument = Location & Document;

export enum LocationType {
  WAREHOUSE = 'warehouse',
  STORE = 'store',
}

@Schema({ timestamps: true })
export class Location {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: LocationType })
  type: LocationType;

  @Prop({ required: true })
  address: string;

  @Prop()
  phone?: string;

  @Prop({ default: true })
  active: boolean;
}

export const LocationSchema = SchemaFactory.createForClass(Location);
LocationSchema.index({ name: 1 });
LocationSchema.index({ type: 1 });


