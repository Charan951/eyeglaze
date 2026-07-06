import mongoose, { Document, Schema } from 'mongoose';

export interface IRuleCondition {
  field: 'cart_total' | 'item_qty' | 'product_id' | 'category' | 'brand' | 'user_membership' | 'user_group';
  operator: 'gte' | 'lte' | 'eq' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: any;
}

export interface IRuleAction {
  type: 'discount_percent' | 'discount_flat' | 'free_shipping' | 'give_product' | 'cashback';
  value: number;
  targetId?: mongoose.Types.ObjectId; // E.g., Free product ID or Category
}

export interface IPromotionRule extends Document {
  name: string;
  description: string;
  conditions: IRuleCondition[];
  actions: IRuleAction[];
  isActive: boolean;
}

const ConditionSchema = new Schema({
  field: {
    type: String,
    enum: ['cart_total', 'item_qty', 'product_id', 'category', 'brand', 'user_membership', 'user_group'],
    required: true,
  },
  operator: {
    type: String,
    enum: ['gte', 'lte', 'eq', 'contains', 'not_contains', 'in', 'not_in'],
    required: true,
  },
  value: { type: Schema.Types.Mixed, required: true },
}, { _id: false });

const ActionSchema = new Schema({
  type: {
    type: String,
    enum: ['discount_percent', 'discount_flat', 'free_shipping', 'give_product', 'cashback'],
    required: true,
  },
  value: { type: Number, required: true },
  targetId: { type: Schema.Types.ObjectId },
}, { _id: false });

const PromotionRuleSchema = new Schema<IPromotionRule>(
  {
    name: { type: String, required: true },
    description: { type: String },
    conditions: [ConditionSchema],
    actions: [ActionSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PromotionRule = mongoose.models.PromotionRule || mongoose.model<IPromotionRule>('PromotionRule', PromotionRuleSchema);
