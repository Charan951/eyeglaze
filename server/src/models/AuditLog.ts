import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  productId?: mongoose.Types.ObjectId;
  targetId?: mongoose.Types.ObjectId;
  targetType?: string;
  action: 'create' | 'update' | 'delete' | 'publish' | 'schedule' | 'restore' | 'duplicate' | 'import';
  performedBy: mongoose.Types.ObjectId;
  performedByName: string;
  changes?: Record<string, any>;
  version: number;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: false, index: true },
    targetId: { type: Schema.Types.ObjectId, required: false, index: true },
    targetType: { type: String, required: false },
    action: { type: String, enum: ['create', 'update', 'delete', 'publish', 'schedule', 'restore', 'duplicate', 'import'], required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedByName: { type: String, required: true },
    changes: { type: Schema.Types.Map, of: Schema.Types.Mixed },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
