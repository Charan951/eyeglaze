import mongoose, { Document, Schema } from 'mongoose';

export interface IPower {
  name?: string;
  RE?: { sph?: number; cyl?: number; axis?: number };
  LE?: { sph?: number; cyl?: number; axis?: number };
  pd?: number;
}

export interface ICartItem {
  _id?: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  qty: number;
  color?: string;
  frameSize?: 'Small' | 'Medium' | 'Large';
  lensType?: string;
  lensSubType?: string;
  power?: IPower;
  lensQuality?: string;
  lensPrice?: number;
  framePrice: number;
  memberFramePrice?: number;
  fittingCharge: number;
  deliveryCharge: number;
  appliedOffers?: string[];
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  couponCode?: string;
  couponDiscount?: number;
  addGoldMembership?: boolean;
  updatedAt: Date;
}

const PowerSchema = new Schema(
  {
    name: String,
    RE: { sph: Number, cyl: Number, axis: Number },
    LE: { sph: Number, cyl: Number, axis: Number },
    pd: Number,
  },
  { _id: false }
);

const CartItemSchema = new Schema<ICartItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  qty: { type: Number, default: 1 },
  color: { type: String },
  frameSize: { type: String, enum: ['Small', 'Medium', 'Large'] },
  lensType: { type: String },
  lensSubType: { type: String },
  power: PowerSchema,
  lensQuality: { type: String },
  lensPrice: { type: Number },
  framePrice: { type: Number, default: 1 },
  memberFramePrice: { type: Number },
  fittingCharge: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 99 },
  appliedOffers: [{ type: String }],
});

const CartSchema = new Schema<ICart>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [CartItemSchema],
  couponCode: { type: String },
  couponDiscount: { type: Number },
  addGoldMembership: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

export const Cart = mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
