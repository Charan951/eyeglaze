import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/mongodb';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';

async function main() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Connected!');

  // 1. Find Eyeglasses and Sunglasses categories
  const eyeglassesCat = await Category.findOne({ slug: 'eyeglasses' });
  const sunglassesCat = await Category.findOne({ slug: 'sunglasses' });

  if (eyeglassesCat) {
    console.log(`Found Eyeglasses category with ID: ${eyeglassesCat._id}`);
    const eyeglassesSubs = [
      { name: 'Men', slug: 'eyeglasses-men', code: 'SUBCAT-EYE-MEN', gender: 'men', bannerImage: '/images/men_eyeglasses.png', displayOrder: 1, shapeModal: true },
      { name: 'Women', slug: 'eyeglasses-women', code: 'SUBCAT-EYE-WOMEN', gender: 'women', bannerImage: '/images/women_eyeglasses.png', displayOrder: 2, shapeModal: true },
      { name: 'Kids', slug: 'eyeglasses-kids', code: 'SUBCAT-EYE-KIDS', gender: 'kids', bannerImage: '/images/kids_eyeglasses.png', displayOrder: 3, shapeModal: true },
      { name: 'Contact Lenses', slug: 'eyeglasses-contacts', code: 'SUBCAT-EYE-CONTACTS', bannerImage: '/images/cat_contacts.png', linkTo: '/products?category=contact-lenses', displayOrder: 4, shapeModal: false },
    ];

    for (const sub of eyeglassesSubs) {
      await SubCategory.findOneAndUpdate(
        { slug: sub.slug },
        {
          name: sub.name,
          slug: sub.slug,
          code: sub.code,
          categoryId: eyeglassesCat._id,
          bannerImage: sub.bannerImage,
          linkTo: sub.linkTo,
          gender: sub.gender,
          shapeModal: sub.shapeModal,
          displayOrder: sub.displayOrder,
          status: 'Active',
          isDeleted: false,
        },
        { upsert: true, new: true }
      );
      console.log(`Seeded Eyeglasses subcategory: ${sub.name}`);
    }
  } else {
    console.log('WARNING: Eyeglasses category not found.');
  }

  if (sunglassesCat) {
    console.log(`Found Sunglasses category with ID: ${sunglassesCat._id}`);
    const sunglassesSubs = [
      { name: 'Men', slug: 'sunglasses-men', code: 'SUBCAT-SUN-MEN', gender: 'men', bannerImage: '/images/men_sunglasses.png', displayOrder: 1, shapeModal: true },
      { name: 'Women', slug: 'sunglasses-women', code: 'SUBCAT-SUN-WOMEN', gender: 'women', bannerImage: '/images/women_sunglasses.png', displayOrder: 2, shapeModal: true },
      { name: 'Kids', slug: 'sunglasses-kids', code: 'SUBCAT-SUN-KIDS', gender: 'kids', bannerImage: '/images/kids_sunglasses.png', displayOrder: 3, shapeModal: true },
      { name: 'Accessories', slug: 'sunglasses-accessories', code: 'SUBCAT-SUN-ACCESSORIES', bannerImage: '/images/accessories.png', linkTo: '/products?category=accessories', displayOrder: 4, shapeModal: false },
    ];

    for (const sub of sunglassesSubs) {
      await SubCategory.findOneAndUpdate(
        { slug: sub.slug },
        {
          name: sub.name,
          slug: sub.slug,
          code: sub.code,
          categoryId: sunglassesCat._id,
          bannerImage: sub.bannerImage,
          linkTo: sub.linkTo,
          gender: sub.gender,
          shapeModal: sub.shapeModal,
          displayOrder: sub.displayOrder,
          status: 'Active',
          isDeleted: false,
        },
        { upsert: true, new: true }
      );
      console.log(`Seeded Sunglasses subcategory: ${sub.name}`);
    }
  } else {
    console.log('WARNING: Sunglasses category not found.');
  }

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
  console.log('Disconnected!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
