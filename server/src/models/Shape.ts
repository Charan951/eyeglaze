import mongoose, { Document, Schema } from 'mongoose';

export interface IShape extends Document {
  name: string;
  slug: string;
  image: string;
  displayOrder: number;
  status: 'Active' | 'Inactive';
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShapeSchema = new Schema<IShape>(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    image: { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Auto-generate slug from name before saving
ShapeSchema.pre('save', function (this: any) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

ShapeSchema.index({ status: 1 });
ShapeSchema.index({ isDeleted: 1 });

export const Shape = mongoose.models.Shape || mongoose.model<IShape>('Shape', ShapeSchema);
