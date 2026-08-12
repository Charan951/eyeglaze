import mongoose, { Document, Schema } from 'mongoose';

export interface IPower {
  name?: string;
  RE?: { sph?: number | string; cyl?: number | string; axis?: number | string; addPower?: number | string };
  LE?: { sph?: number | string; cyl?: number | string; axis?: number | string; addPower?: number | string };
  pd?: number;
  addPower?: number | string;
  rightBoxes?: number;
  leftBoxes?: number;
  packOption?: string;
  contactPowerType?: 'manual' | 'upload' | 'later';
  prescriptionUrl?: string;
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
  /** When true, framePrice was explicitly set at add-time (e.g. contact lens box pricing,
   *  or a discounted lens-solution cross-sell) and must never be re-synced to the live
   *  catalog price on cart read. */
  priceLocked?: boolean;
  /** The undiscounted catalog price at add-time, kept alongside a locked/overridden
   *  framePrice so the cart can still show "was ₹X" savings for cross-sell discounts. */
  originalPrice?: number;
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
    RE: { sph: Schema.Types.Mixed, cyl: Schema.Types.Mixed, axis: Schema.Types.Mixed, addPower: Schema.Types.Mixed },
    LE: { sph: Schema.Types.Mixed, cyl: Schema.Types.Mixed, axis: Schema.Types.Mixed, addPower: Schema.Types.Mixed },
    pd: Number,
    addPower: Schema.Types.Mixed,
    rightBoxes: Number,
    leftBoxes: Number,
    packOption: String,
    contactPowerType: String,
    prescriptionUrl: String,
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
  priceLocked: { type: Boolean, default: false },
  originalPrice: { type: Number },
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
