import mongoose, { Document, Schema } from 'mongoose';

export interface INavigationMenuItem {
  label: string;
  link: string;
  badge?: string;
  children?: INavigationMenuItem[];
}

export interface INavigationMenu extends Document {
  name: string; // e.g. "Main Navigation Header"
  code: string; // e.g. "main_header"
  items: INavigationMenuItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NavigationMenuItemSchema = new Schema<INavigationMenuItem>({
  label: { type: String, required: true },
  link: { type: String, required: true },
  badge: { type: String },
});

// Allow recursive nesting in the schema
NavigationMenuItemSchema.add({
  children: [NavigationMenuItemSchema],
});

const NavigationMenuSchema = new Schema<INavigationMenu>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    items: [NavigationMenuItemSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const NavigationMenu =
  mongoose.models.NavigationMenu || mongoose.model<INavigationMenu>('NavigationMenu', NavigationMenuSchema);
