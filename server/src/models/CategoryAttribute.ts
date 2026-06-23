import mongoose, { Document, Schema } from 'mongoose';

export interface ICategoryAttribute extends Document {
  targetId: mongoose.Types.ObjectId;
  targetType: 'Category' | 'SubCategory';
  genders: string[]; // 'Men' | 'Women' | 'Kids' | 'Unisex'
  ageGroups: string[]; // '0-5' | '6-12' | '13-18' | '18-25' | '26-35' | '36-50' | '50+'
  usageTypes: string[]; // 'Daily Wear' | 'Office Wear' | 'Computer Use' | etc.
  faceShapes: string[]; // 'Round' | 'Oval' | 'Square' | etc.
  occasions: string[]; // 'Casual' | 'Formal' | 'Business' | etc.
  createdAt: Date;
  updatedAt: Date;
}

const CategoryAttributeSchema = new Schema<ICategoryAttribute>(
  {
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetType: {
      type: String,
      required: true,
      enum: ['Category', 'SubCategory'],
    },
    genders: [{ type: String }],
    ageGroups: [{ type: String }],
    usageTypes: [{ type: String }],
    faceShapes: [{ type: String }],
    occasions: [{ type: String }],
  },
  { timestamps: true }
);

CategoryAttributeSchema.index({ targetId: 1, targetType: 1 }, { unique: true });

export const CategoryAttribute =
  mongoose.models.CategoryAttribute ||
  mongoose.model<ICategoryAttribute>('CategoryAttribute', CategoryAttributeSchema);
