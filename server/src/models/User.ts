import mongoose, { Document, Schema } from 'mongoose';

export interface IAddress {
  _id?: mongoose.Types.ObjectId;
  fullName: string;
  mobile: string;
  alternativeNumber?: string;
  pincode: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  type: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
}

export interface ICard {
  _id?: mongoose.Types.ObjectId;
  number: string;
  name: string;
  expiry: string;
  type: 'visa' | 'mastercard' | 'amex' | 'discover' | 'generic';
  bgClass: string;
}

export interface IWallet {
  _id?: mongoose.Types.ObjectId;
  walletId: string;
  name: string;
  icon: string;
  linked: boolean;
  emailOrPhone?: string;
}

export interface ITransaction {
  _id?: mongoose.Types.ObjectId;
  type: 'Refund' | 'Added' | 'Paid' | 'Order' | 'Cashback';
  amount: number;
  date: Date;
  description: string;
}

export interface IUser extends Document {
  phone?: string;
  mobile?: string;
  alternativeNumber?: string;
  countryCode: string;
  email?: string;
  password?: string;
  otp?: string;
  otpExpiry?: Date;
  isVerified: boolean;
  name?: string;
  role: 'user' | 'admin' | 'customer' | 'store_manager' | 'support_agent';
  adminRole?: 'super_admin' | 'store_manager' | 'support_agent';
  addresses: IAddress[];
  walletBalance: number;
  savedCards: ICard[];
  linkedWallets: IWallet[];
  transactions: ITransaction[];
  wishlist: mongoose.Types.ObjectId[];
  savedPrescriptions: mongoose.Types.ObjectId[];
  membershipActive: boolean;
  membershipExpiry?: Date;
  termsAcceptedAt?: Date;
  oneRupeeOfferUsed: boolean;
  oneRupeeOfferCount: number;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  isBlocked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>({
  fullName: String,
  mobile: String,
  alternativeNumber: String,
  pincode: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  type: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
  isDefault: { type: Boolean, default: false },
});

const CardSchema = new Schema<ICard>({
  number: String,
  name: String,
  expiry: String,
  type: { type: String, enum: ['visa', 'mastercard', 'amex', 'discover', 'generic'], default: 'generic' },
  bgClass: String,
});

const WalletSchema = new Schema<IWallet>({
  walletId: String,
  name: String,
  icon: String,
  linked: { type: Boolean, default: false },
  emailOrPhone: String,
});

const TransactionSchema = new Schema<ITransaction>({
  type: { type: String, enum: ['Refund', 'Added', 'Paid', 'Order', 'Cashback'] },
  amount: Number,
  date: { type: Date, default: Date.now },
  description: String,
});

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, unique: true, sparse: true },
    mobile: { type: String, unique: true, sparse: true },
    countryCode: { type: String, default: '+91' },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    password: { type: String },
    otp: { type: String },
    otpExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },
    name: { type: String },
    role: {
      type: String,
      enum: ['user', 'admin', 'customer', 'store_manager', 'support_agent'],
      default: 'user',
    },
    adminRole: {
      type: String,
      enum: ['super_admin', 'store_manager', 'support_agent'],
    },
    addresses: [AddressSchema],
    walletBalance: { type: Number, default: 0 },
    savedCards: [CardSchema],
    linkedWallets: {
      type: [WalletSchema],
      default: [
        { walletId: 'gpay', name: 'Google Pay', icon: '🔍', linked: false },
        { walletId: 'phonepe', name: 'PhonePe', icon: '📱', linked: false },
        { walletId: 'paytm', name: 'Paytm Wallet', icon: '💸', linked: false },
        { walletId: 'applepay', name: 'Apple Pay', icon: '🍎', linked: false },
      ]
    },
    transactions: [TransactionSchema],
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    savedPrescriptions: [{ type: Schema.Types.ObjectId, ref: 'Prescription' }],
    membershipActive: { type: Boolean, default: false },
    membershipExpiry: { type: Date },
    termsAcceptedAt: { type: Date },
    oneRupeeOfferUsed: { type: Boolean, default: false },
    oneRupeeOfferCount: { type: Number, default: 0 },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    loginAttempts: { type: Number, default: 0, required: true },
    lockUntil: { type: Date },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
