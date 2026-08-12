import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  image: string;
  tag?: string;
  readTime?: string;
  author?: string;
  status: 'Draft' | 'Published';
  displayOrder: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String },
    image: { type: String, required: true },
    tag: { type: String },
    readTime: { type: String, default: '4 min read' },
    author: { type: String, default: 'EyeGlaze Team' },
    status: { type: String, enum: ['Draft', 'Published'], default: 'Published' },
    displayOrder: { type: Number, default: 0 },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

BlogSchema.index({ status: 1, displayOrder: 1, publishedAt: -1 });

export const Blog = mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);
