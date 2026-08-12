import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  // The previous hash and when it was rotated out — kept briefly so that
  // multiple browser tabs racing to refresh the same (about-to-expire)
  // token don't trip reuse-detection on each other. See refreshToken().
  previousRefreshTokenHash?: string;
  previousTokenRotatedAt?: Date;
  userAgent?: string;
  ipAddress?: string;
  isValid: boolean;
  createdAt: Date;
  expiresAt: Date;
}

const SessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  refreshTokenHash: { type: String, required: true, unique: true, index: true },
  previousRefreshTokenHash: { type: String },
  previousTokenRotatedAt: { type: Date },
  userAgent: { type: String },
  ipAddress: { type: String },
  isValid: { type: Boolean, default: true, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

export const Session = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
