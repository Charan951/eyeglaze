import mongoose, { Document, Schema } from 'mongoose';

export interface IWalletTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: 'Credit' | 'Debit';
  source: 'Cashback' | 'Refund' | 'Referral' | 'Purchase' | 'GiftCard' | 'Manual';
  description: string;
  orderId?: string;
  referenceId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Credit', 'Debit'], required: true, index: true },
    source: {
      type: String,
      enum: ['Cashback', 'Refund', 'Referral', 'Purchase', 'GiftCard', 'Manual'],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    orderId: { type: String, index: true },
    referenceId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

export const WalletTransaction = mongoose.models.WalletTransaction || mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);
