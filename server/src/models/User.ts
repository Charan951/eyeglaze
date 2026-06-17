import mongoose, { Document, Schema } from 'mongoose';

export interface IAddress {
  _id?: mongoose.Types.ObjectId;
  fullName: string;
  mobile: string;
  pincode: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  type: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
}

export interface IUser extends Document {
  phone?: string;
  mobile?: string;
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
  wishlist: mongoose.Types.ObjectId[];
  savedPrescriptions: mongoose.Types.ObjectId[];
  membershipActive: boolean;
  membershipExpiry?: Date;
  termsAcceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>({
  fullName: String,
  mobile: String,
  pincode: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  type: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
  isDefault: { type: Boolean, default: false },
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
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    savedPrescriptions: [{ type: Schema.Types.ObjectId, ref: 'Prescription' }],
    membershipActive: { type: Boolean, default: false },
    membershipExpiry: { type: Date },
    termsAcceptedAt: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
