import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  emailLower: string;

  @Prop({ required: true, min: 0, max: 150 })
  age: number;

  @Prop({ type: String, required: false })
  phone?: string;

  @Prop({ type: String, required: false })
  address?: string;

  // Soft delete fields
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, default: null })
  deletedBy?: Types.ObjectId;

  @Prop({ type: String, default: null })
  deleteReason?: string;

  // Audit fields
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save middleware to set emailLower
// UserSchema.pre('save', function (next) {
//   if (this.isModified('email') || this.isNew) {
//     this.emailLower = this.email.toLowerCase();
//   }
//   next();
// });

// Indexes
// UserSchema.index({ emailLower: 1 }, { unique: true });
// UserSchema.index({ name: 'text', email: 'text' }, { 
//   weights: { name: 3, email: 1 },
//   name: 'text_search_index'
// });
// UserSchema.index({ age: 1, createdAt: -1 });
// UserSchema.index({ isDeleted: 1 });
// UserSchema.index({ createdAt: 1 });
