import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  qty: number;
  color?: string;
  frameSize?: 'Small' | 'Medium' | 'Large';
  lensType?: string;
  lensSubType?: string;
  power?: {
    RE?: { sph?: number; cyl?: number; axis?: number };
    LE?: { sph?: number; cyl?: number; axis?: number };
    pd?: number;
    addPower?: number;
  };
  lensQuality?: string;
  lensPrice?: number;
  framePrice: number;
  memberFramePrice?: number;
  fittingCharge: number;
  appliedOffers?: string[];
}

export interface IOrder extends Document {
  orderNumber: string;
  orderId: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  address: {
    fullName: string;
    mobile: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  subtotal: number;
  deliveryCharge: number;
  fittingCharge: number;
  discount: number;
  walletUsed: number;
  total: number;
  coupon?: {
    code: string;
    discountType: 'percent' | 'flat';
    discountValue: number;
    amountSaved: number;
  };
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  statusHistory: { status: string; timestamp: Date; note?: string }[];
  trackingNumber?: string;
  courierPartner?: string;
  estimatedDelivery?: Date;
  prescriptionVerified: boolean;
  internalNotes: { note: string; addedBy?: mongoose.Types.ObjectId; addedAt: Date }[];
  isFlagged: boolean;
  membershipAdded?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PowerSchema = new Schema(
  {
    RE: { sph: Number, cyl: Number, axis: Number },
    LE: { sph: Number, cyl: Number, axis: Number },
    pd: Number,
    addPower: Number,
  },
  { _id: false }
);

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  qty: { type: Number, default: 1 },
  color: String,
  frameSize: { type: String, enum: ['Small', 'Medium', 'Large'] },
  lensType: String,
  lensSubType: String,
  power: PowerSchema,
  lensQuality: String,
  lensPrice: Number,
  framePrice: { type: Number, default: 1 },
  memberFramePrice: Number,
  fittingCharge: { type: Number, default: 0 },
  appliedOffers: [{ type: String }],
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, unique: true },
    orderId: { type: String, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    address: {
      fullName: String,
      mobile: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },
    subtotal: Number,
    deliveryCharge: { type: Number, default: 99 },
    fittingCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    walletUsed: { type: Number, default: 0 },
    total: Number,
    coupon: {
      code: String,
      discountType: { type: String, enum: ['percent', 'flat'] },
      discountValue: Number,
      amountSaved: Number,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: String,
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
    trackingNumber: String,
    courierPartner: String,
    estimatedDelivery: Date,
    prescriptionVerified: { type: Boolean, default: false },
    internalNotes: [
      {
        note: String,
        addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    isFlagged: { type: Boolean, default: false },
    membershipAdded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
