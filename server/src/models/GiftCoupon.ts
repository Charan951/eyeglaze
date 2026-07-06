import mongoose, { Document, Schema } from 'mongoose';

export interface IGiftCoupon extends Document {
  code: string;
  initialBalance: number;
  currentBalance: number;
  senderId?: mongoose.Types.ObjectId;
  recipientEmail: string;
  recipientId?: mongoose.Types.ObjectId;
  validFrom: Date;
  validTo?: Date;
  isActive: boolean;
  isUsed: boolean;
  message?: string;
}

const GiftCouponSchema = new Schema<IGiftCoupon>(
  {
    code: { type: String, unique: true, required: true, uppercase: true, index: true },
    initialBalance: { type: Number, required: true, min: 0 },
    currentBalance: { type: Number, required: true, min: 0 },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    recipientEmail: { type: String, required: true, lowercase: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    validFrom: { type: Date, default: Date.now },
    validTo: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    isUsed: { type: Boolean, default: false, index: true },
    message: { type: String },
  },
  { timestamps: true }
);

export const GiftCoupon = mongoose.models.GiftCoupon || mongoose.model<IGiftCoupon>('GiftCoupon', GiftCouponSchema);
