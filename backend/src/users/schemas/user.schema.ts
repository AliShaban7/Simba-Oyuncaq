import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  WAREHOUSE = 'warehouse',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.CASHIER })
  role: UserRole;

  @Prop({ default: true })
  active: boolean;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ username: 1 });


