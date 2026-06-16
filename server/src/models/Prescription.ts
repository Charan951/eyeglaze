import mongoose, { Document, Schema } from 'mongoose';

export interface IPrescription extends Document {
  user: mongoose.Types.ObjectId;
  RE?: { sph?: number; cyl?: number; axis?: number };
  LE?: { sph?: number; cyl?: number; axis?: number };
  pd?: number;
  uploadedFile?: string;
  imageUrl?: string;
  verified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EyeSchema = new Schema({ sph: Number, cyl: Number, axis: Number }, { _id: false });

const PrescriptionSchema = new Schema<IPrescription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    RE: EyeSchema,
    LE: EyeSchema,
    pd: Number,
    uploadedFile: String,
    imageUrl: String,
    verified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String,
  },
  { timestamps: true }
);

export const Prescription =
  mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
