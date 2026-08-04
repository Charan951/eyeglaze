import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { connectDB } from '../config/mongodb';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { SubSubCategory } from '../models/SubSubCategory';
import { SubSubSubCategory } from '../models/SubSubSubCategory';

async function seedHierarchy() {
  console.log('Connecting to Mongo DB...');
  await connectDB();
  console.log('Connected!');

  console.log('Seeding Category Hierarchy...');

  // Wipe existing subcategories hierarchy to start fresh
  await SubSubSubCategory.deleteMany({});
  await SubSubCategory.deleteMany({});
  await SubCategory.deleteMany({});

  const upsertCat = async (data: any) => {
    let cat = await Category.findOne({
      $or: [{ slug: data.slug }, { name: data.name }, { code: data.code }]
    });
    if (cat) {
      Object.assign(cat, data);
      await cat.save();
    } else {
      cat = await Category.create(data);
    }
    return cat;
  };

  // 1. EYEGLASSES
  const eyeglassesCat = await upsertCat({
    name: 'Eyeglasses',
    code: 'CAT-EYEGLASSES',
    slug: 'eyeglasses',
    icon: '👓',
    bannerImage: '/images/men_eyeglasses.png',
    description: 'Premium designer eyeglasses frames with free lenses',
    displayOrder: 1,
    status: 'Active',
    isDeleted: false,
    showInNavbar: true,
  });

  // Eyeglasses Subcategories & SubSubCategories
  const eyeSubs = [
    {
      name: 'MEN EYEGLASSES',
      slug: 'men-eyeglasses',
      code: 'SUBCAT-EYE-MEN',
      gender: 'men',
      bannerImage: '/images/men_eyeglasses.png',
      displayOrder: 1,
      children: [
        { name: 'JOHN JACOBS | OWNDAYS | LE PETIT', slug: 'john-jacobs-owndays-le-petit-men', icon: '/images/men_eyeglasses.png', startingPrice: 3000, displayOrder: 1 },
        { name: 'VINCENT CHASE | LENSKART AIR', slug: 'vincent-chase-lenskart-air-men', icon: '/images/men_eyeglasses.png', startingPrice: 1500, displayOrder: 2 },
        { name: 'HUSTLR', slug: 'hustlr-men', icon: '/images/men_eyeglasses.png', startingPrice: 500, displayOrder: 3 },
        { name: 'ESSENTIALS', slug: 'essentials-men', icon: '/images/men_eyeglasses.png', startingPrice: 500, displayOrder: 4 },
        { name: 'ALL BRANDS', slug: 'all-brands-men', icon: '/images/men_eyeglasses.png', startingPrice: 800, displayOrder: 5 },
      ]
    },
    {
      name: 'WOMEN EYEGLASSES',
      slug: 'women-eyeglasses',
      code: 'SUBCAT-EYE-WOMEN',
      gender: 'women',
      bannerImage: '/images/women_eyeglasses.png',
      displayOrder: 2,
      children: [
        { name: 'JOHN JACOBS | OWNDAYS | LE PETIT', slug: 'john-jacobs-owndays-le-petit-women', icon: '/images/women_eyeglasses.png', startingPrice: 3000, displayOrder: 1 },
        { name: 'VINCENT CHASE | LENSKART AIR', slug: 'vincent-chase-lenskart-air-women', icon: '/images/women_eyeglasses.png', startingPrice: 1500, displayOrder: 2 },
        { name: 'HUSTLR', slug: 'hustlr-women', icon: '/images/women_eyeglasses.png', startingPrice: 500, displayOrder: 3 },
        { name: 'ESSENTIALS', slug: 'essentials-women', icon: '/images/women_eyeglasses.png', startingPrice: 500, displayOrder: 4 },
        { name: 'ALL BRANDS', slug: 'all-brands-women', icon: '/images/women_eyeglasses.png', startingPrice: 800, displayOrder: 5 },
      ]
    },
    {
      name: 'KIDS EYEGLASSES',
      slug: 'kids-eyeglasses',
      code: 'SUBCAT-EYE-KIDS',
      gender: 'kids',
      bannerImage: '/images/kids_eyeglasses.png',
      displayOrder: 3,
      children: [
        { name: 'JUNIORS | 6 TO 8 YEARS', slug: 'juniors-6-to-8-years', icon: '/images/kids_eyeglasses.png', startingPrice: 800, displayOrder: 1 },
        { name: 'TWEENS | 8 TO 10 YEARS', slug: 'tweens-8-to-10-years', icon: '/images/kids_eyeglasses.png', startingPrice: 500, displayOrder: 2 },
        { name: 'TEENS | 10 TO 16 YEARS', slug: 'teens-10-to-16-years', icon: '/images/kids_eyeglasses.png', startingPrice: 1500, displayOrder: 3 },
      ]
    }
  ];

  for (const s of eyeSubs) {
    const subDoc = await SubCategory.create({
      name: s.name,
      code: s.code,
      slug: s.slug,
      categoryId: eyeglassesCat._id,
      gender: s.gender,
      bannerImage: s.bannerImage,
      displayOrder: s.displayOrder,
      status: 'Active',
      isDeleted: false,
    });

    for (const ss of s.children) {
      await SubSubCategory.create({
        name: ss.name,
        code: `SUBSUB-${ss.slug.toUpperCase()}`,
        slug: ss.slug,
        categoryId: eyeglassesCat._id,
        subCategoryId: subDoc._id,
        icon: ss.icon,
        startingPrice: ss.startingPrice,
        displayOrder: ss.displayOrder,
        status: 'Active',
        isDeleted: false,
      });
    }
  }

  // 2. SUNGLASSES
  const sunglassesCat = await upsertCat({
    name: 'Sunglasses',
    code: 'CAT-SUNGLASSES',
    slug: 'sunglasses',
    icon: '🕶️',
    bannerImage: '/images/men_sunglasses.png',
    description: 'Polarized UV protection luxury sunglasses',
    displayOrder: 2,
    status: 'Active',
    isDeleted: false,
    showInNavbar: true,
  });

  const sunSubs = [
    {
      name: 'MEN SUNGLASSES',
      slug: 'men-sunglasses',
      code: 'SUBCAT-SUN-MEN',
      gender: 'men',
      bannerImage: '/images/men_sunglasses.png',
      displayOrder: 1,
      children: [
        { name: 'JOHN JACOBS | OWNDAYS | LE PETIT', slug: 'john-jacobs-owndays-le-petit-men-sun', icon: '/images/men_sunglasses.png', startingPrice: 3000, displayOrder: 1 },
        { name: 'VINCENT CHASE | LENSKART AIR', slug: 'vincent-chase-lenskart-air-men-sun', icon: '/images/men_sunglasses.png', startingPrice: 1500, displayOrder: 2 },
        { name: 'HUSTLR', slug: 'hustlr-men-sun', icon: '/images/men_sunglasses.png', startingPrice: 500, displayOrder: 3 },
        { name: 'ESSENTIALS', slug: 'essentials-men-sun', icon: '/images/men_sunglasses.png', startingPrice: 500, displayOrder: 4 },
        { name: 'ALL BRANDS', slug: 'all-brands-men-sun', icon: '/images/men_sunglasses.png', startingPrice: 800, displayOrder: 5 },
      ]
    },
    {
      name: 'WOMEN SUNGLASSES',
      slug: 'women-sunglasses',
      code: 'SUBCAT-SUN-WOMEN',
      gender: 'women',
      bannerImage: '/images/women_sunglasses.png',
      displayOrder: 2,
      children: [
        { name: 'JOHN JACOBS | OWNDAYS | LE PETIT', slug: 'john-jacobs-owndays-le-petit-women-sun', icon: '/images/women_sunglasses.png', startingPrice: 3000, displayOrder: 1 },
        { name: 'VINCENT CHASE | LENSKART AIR', slug: 'vincent-chase-lenskart-air-women-sun', icon: '/images/women_sunglasses.png', startingPrice: 1500, displayOrder: 2 },
        { name: 'HUSTLR', slug: 'hustlr-women-sun', icon: '/images/women_sunglasses.png', startingPrice: 500, displayOrder: 3 },
        { name: 'ESSENTIALS', slug: 'essentials-women-sun', icon: '/images/women_sunglasses.png', startingPrice: 500, displayOrder: 4 },
        { name: 'ALL BRANDS', slug: 'all-brands-women-sun', icon: '/images/women_sunglasses.png', startingPrice: 800, displayOrder: 5 },
      ]
    },
    {
      name: 'KIDS SUNGLASSES',
      slug: 'kids-sunglasses',
      code: 'SUBCAT-SUN-KIDS',
      gender: 'kids',
      bannerImage: '/images/kids_sunglasses.png',
      displayOrder: 3,
      children: [
        { name: 'JUNIORS | 6 TO 8 YEARS', slug: 'juniors-6-to-8-years-sun', icon: '/images/kids_sunglasses.png', startingPrice: 800, displayOrder: 1 },
        { name: 'TWEENS | 8 TO 10 YEARS', slug: 'tweens-8-to-10-years-sun', icon: '/images/kids_sunglasses.png', startingPrice: 500, displayOrder: 2 },
        { name: 'TEENS | 10 TO 16 YEARS', slug: 'teens-10-to-16-years-sun', icon: '/images/kids_sunglasses.png', startingPrice: 1500, displayOrder: 3 },
      ]
    }
  ];

  for (const s of sunSubs) {
    const subDoc = await SubCategory.create({
      name: s.name,
      code: s.code,
      slug: s.slug,
      categoryId: sunglassesCat._id,
      gender: s.gender,
      bannerImage: s.bannerImage,
      displayOrder: s.displayOrder,
      status: 'Active',
      isDeleted: false,
    });

    for (const ss of s.children) {
      await SubSubCategory.create({
        name: ss.name,
        code: `SUBSUB-${ss.slug.toUpperCase()}`,
        slug: ss.slug,
        categoryId: sunglassesCat._id,
        subCategoryId: subDoc._id,
        icon: ss.icon,
        startingPrice: ss.startingPrice,
        displayOrder: ss.displayOrder,
        status: 'Active',
        isDeleted: false,
      });
    }
  }

  // 3. CONTACT LENS
  const contactCat = await upsertCat({
    name: 'Contact Lens',
    code: 'CAT-CONTACTLENSES',
    slug: 'contact-lens',
    icon: '👁️',
    bannerImage: '/images/cat_contacts.png',
    description: 'Clear, color, and disposable contact lenses',
    displayOrder: 4,
    status: 'Active',
    isDeleted: false,
    showInNavbar: true,
  });

  const contactSubs = [
    {
      name: 'CLEAR CONTACTS',
      slug: 'clear',
      code: 'SUBCAT-CONTACT-CLEAR',
      bannerImage: '/images/cat_contacts.png',
      displayOrder: 1,
      children: [
        {
          name: 'DISTANCE POWER(-VE)',
          slug: 'distance-power-ve',
          icon: '/images/cat_contacts.png',
          startingPrice: 249,
          displayOrder: 1,
          subChildren: [
            { name: 'Monthly', slug: 'monthly-clear-distance', displayOrder: 1 },
            { name: 'Dailies', slug: 'dailies-clear-distance', displayOrder: 2 },
            { name: 'Bi-Weekly', slug: 'bi-weekly-clear-distance', displayOrder: 3 },
            { name: 'Yearly', slug: 'yearly-clear-distance', displayOrder: 4 },
          ]
        },
        {
          name: 'TORIC/CYLINDERICAL',
          slug: 'toric-cylindrical',
          icon: '/images/cat_contacts.png',
          startingPrice: 349,
          displayOrder: 2,
          subChildren: [
            { name: 'Monthly', slug: 'monthly-clear-toric', displayOrder: 1 },
            { name: 'Dailies', slug: 'dailies-clear-toric', displayOrder: 2 },
            { name: 'Bi-Weekly', slug: 'bi-weekly-clear-toric', displayOrder: 3 },
            { name: 'Yearly', slug: 'yearly-clear-toric', displayOrder: 4 },
          ]
        },
        { name: 'MULTI-FOCAL', slug: 'multi-focal', icon: '/images/cat_contacts.png', startingPrice: 2000, displayOrder: 3, subChildren: [] },
        { name: 'ALL POWERS', slug: 'all-powers', icon: '/images/cat_contacts.png', startingPrice: 249, displayOrder: 4, subChildren: [] },
      ]
    },
    {
      name: 'COLOR CONTACTS',
      slug: 'color',
      code: 'SUBCAT-CONTACT-COLOR',
      bannerImage: '/images/cat_contacts.png',
      displayOrder: 2,
      children: [
        { name: 'ZERO POWER', slug: 'zero-power', icon: '/images/cat_contacts.png', startingPrice: 179, displayOrder: 1, subChildren: [] },
        { name: 'WITH POWER', slug: 'with-power', icon: '/images/cat_contacts.png', startingPrice: 199, displayOrder: 2, subChildren: [] },
        { name: 'COLOR COMBOS', slug: 'color-combos', icon: '/images/cat_contacts.png', startingPrice: 399, displayOrder: 3, subChildren: [] },
      ]
    },
    {
      name: 'SOLUTION & ACCESSORIES',
      slug: 'solutions-accessories',
      code: 'SUBCAT-CONTACT-SOLUTIONS',
      bannerImage: '/images/accessories.png',
      displayOrder: 3,
      children: [
        { name: 'SOLUTION', slug: 'solution', icon: '/images/accessories.png', startingPrice: 149, displayOrder: 1, subChildren: [] },
        { name: 'ACCESSORIES', slug: 'accessories', icon: '/images/accessories.png', startingPrice: 159, displayOrder: 2, subChildren: [] },
      ]
    }
  ];

  for (const s of contactSubs) {
    const subDoc = await SubCategory.create({
      name: s.name,
      code: s.code,
      slug: s.slug,
      categoryId: contactCat._id,
      bannerImage: s.bannerImage,
      displayOrder: s.displayOrder,
      status: 'Active',
      isDeleted: false,
    });

    for (const ss of s.children) {
      const subSubDoc = await SubSubCategory.create({
        name: ss.name,
        code: `SUBSUB-${ss.slug.toUpperCase()}`,
        slug: ss.slug,
        categoryId: contactCat._id,
        subCategoryId: subDoc._id,
        icon: ss.icon,
        startingPrice: ss.startingPrice,
        displayOrder: ss.displayOrder,
        status: 'Active',
        isDeleted: false,
      });

      if (ss.subChildren && ss.subChildren.length > 0) {
        for (const sss of ss.subChildren) {
          await SubSubSubCategory.create({
            name: sss.name,
            code: `SUBSUBSUB-${sss.slug.toUpperCase()}`,
            slug: sss.slug,
            categoryId: contactCat._id,
            subCategoryId: subDoc._id,
            subSubCategoryId: subSubDoc._id,
            displayOrder: sss.displayOrder,
            status: 'Active',
            isDeleted: false,
          });
        }
      }
    }
  }

  // 4. SPECIAL POWER
  const specialCat = await upsertCat({
    name: 'Special Power',
    code: 'CAT-SPECIALPOWER',
    slug: 'special-power',
    icon: '⚡',
    bannerImage: '/images/cat_blue_light.png',
    description: 'Zero power blue-light, reading, and prescription sunglasses',
    displayOrder: 3,
    status: 'Active',
    isDeleted: false,
    showInNavbar: true,
  });

  const specialSubs = [
    {
      name: 'PRE-FIT ZERO POWER',
      slug: 'zeropower',
      code: 'SUBCAT-SP-ZERO',
      bannerImage: '/images/cat_blue_light.png',
      displayOrder: 1,
      children: [
        { name: 'EyeGlaze BLU', slug: 'eyeglaze-blu', icon: '/images/cat_blue_light.png', displayOrder: 1 },
        { name: 'Computer Glasses', slug: 'computer-glasses-sp', icon: '/images/cat_blue_light.png', displayOrder: 2 },
      ]
    },
    {
      name: 'POWER SUNGLASSES',
      slug: 'powersun',
      code: 'SUBCAT-SP-SUN',
      bannerImage: '/images/cat_sunglasses.png',
      displayOrder: 2,
      children: [
        { name: 'Men Power Sun', slug: 'men-power-sun', icon: '/images/men_sunglasses.png', displayOrder: 1 },
        { name: 'Women Power Sun', slug: 'women-power-sun', icon: '/images/women_sunglasses.png', displayOrder: 2 },
      ]
    },
    {
      name: 'READING',
      slug: 'reading',
      code: 'SUBCAT-SP-READING',
      bannerImage: '/images/reading_book.png',
      displayOrder: 3,
      children: [
        { name: 'Ready Power +1.0', slug: 'ready-power-1-0', icon: '/images/reading_book.png', displayOrder: 1 },
        { name: 'Ready Power +1.25', slug: 'ready-power-1-25', icon: '/images/reading_book.png', displayOrder: 2 },
        { name: 'Ready Power +1.5', slug: 'ready-power-1-5', icon: '/images/reading_book.png', displayOrder: 3 },
        { name: 'Ready Power +1.75', slug: 'ready-power-1-75', icon: '/images/reading_book.png', displayOrder: 4 },
        { name: 'Ready Power +2.0', slug: 'ready-power-2-0', icon: '/images/reading_book.png', displayOrder: 5 },
      ]
    }
  ];

  for (const s of specialSubs) {
    const subDoc = await SubCategory.create({
      name: s.name,
      code: s.code,
      slug: s.slug,
      categoryId: specialCat._id,
      bannerImage: s.bannerImage,
      displayOrder: s.displayOrder,
      status: 'Active',
      isDeleted: false,
    });

    for (const ss of s.children) {
      await SubSubCategory.create({
        name: ss.name,
        code: `SUBSUB-${ss.slug.toUpperCase()}`,
        slug: ss.slug,
        categoryId: specialCat._id,
        subCategoryId: subDoc._id,
        icon: ss.icon,
        displayOrder: ss.displayOrder,
        status: 'Active',
        isDeleted: false,
      });
    }
  }

  console.log('Category Hierarchy Seeded Successfully!');
  process.exit(0);
}

seedHierarchy().catch((err) => {
  console.error('Error seeding category hierarchy:', err);
  process.exit(1);
});
