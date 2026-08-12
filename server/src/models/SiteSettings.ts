import mongoose, { Document, Schema } from 'mongoose';

export interface ISocialLink {
  platform: string;
  url: string;
}

export interface ISiteSettings extends Document {
  contactEmail: string;
  contactPhone: string;
  contactPhoneLabel?: string;
  address: string;
  socialLinks: ISocialLink[];
  createdAt: Date;
  updatedAt: Date;
}

const SocialLinkSchema = new Schema<ISocialLink>(
  {
    platform: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    contactEmail: { type: String, default: 'support@eyeglaze.com' },
    contactPhone: { type: String, default: '1800-419-5888' },
    contactPhoneLabel: { type: String, default: 'Toll-Free' },
    address: { type: String, default: 'EyeGlaze HQ, Cyber City, HITECH City, Hyderabad, TG 500081, India' },
    socialLinks: {
      type: [SocialLinkSchema],
      default: [
        { platform: 'instagram', url: 'https://instagram.com' },
        { platform: 'facebook', url: 'https://facebook.com' },
        { platform: 'twitter', url: 'https://twitter.com' },
      ],
    },
  },
  { timestamps: true }
);

// Singleton collection — there is only ever one settings document.
export const SiteSettings =
  mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
