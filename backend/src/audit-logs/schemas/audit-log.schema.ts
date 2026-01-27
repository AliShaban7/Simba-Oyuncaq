import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  entityType: string; // 'product', 'sale', 'stock_movement', etc.

  @Prop({ required: true })
  entityId: string;

  @Prop({ required: true })
  action: string; // 'create', 'update', 'delete', 'void', 'price_update', etc.

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Object })
  oldValue?: any;

  @Prop({ type: Object })
  newValue?: any;

  @Prop()
  note?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });


