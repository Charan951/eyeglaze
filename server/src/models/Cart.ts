import mongoose, { Document, Schema } from 'mongoose';

export interface IPower {
  RE?: { sph?: number; cyl?: number; axis?: number };
  LE?: { sph?: number; cyl?: number; axis?: number };
  pd?: number;
}

export interface ICartItem {
  _id?: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  qty: number;
  color?: string;
  lensType?: string;
  lensSubType?: string;
  power?: IPower;
  lensQuality?: string;
  lensPrice?: number;
  framePrice: number;
  fittingCharge: number;
  deliveryCharge: number;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  couponCode?: string;
  couponDiscount?: number;
  updatedAt: Date;
}

const PowerSchema = new Schema(
  {
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
  lensType: { type: String },
  lensSubType: { type: String },
  power: PowerSchema,
  lensQuality: { type: String },
  lensPrice: { type: Number },
  framePrice: { type: Number, default: 1 },
  fittingCharge: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 99 },
});

const CartSchema = new Schema<ICart>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [CartItemSchema],
  couponCode: { type: String },
  couponDiscount: { type: Number },
  updatedAt: { type: Date, default: Date.now },
});

export const Cart = mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
