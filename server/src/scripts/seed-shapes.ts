import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/mongodb';
import { Shape } from '../models/Shape';

const shapesToSeed = [
  {
    name: 'Round',
    slug: 'round',
    displayOrder: 1,
    image: '/images/shapes/round.png',
  },
  {
    name: 'Rectangle',
    slug: 'rectangle',
    displayOrder: 2,
    image: '/images/shapes/rectangle.png',
  },
  {
    name: 'Aviator',
    slug: 'aviator',
    displayOrder: 3,
    image: '/images/shapes/aviator.png',
  },
  {
    name: 'Square',
    slug: 'square',
    displayOrder: 4,
    image: '/images/shapes/clubmaster.png', // Using premium square/clubmaster image asset
  },
  {
    name: 'Cat Eye',
    slug: 'cat-eye',
    displayOrder: 5,
    image: '/images/shapes/cat-eye.png',
  },
  {
    name: 'Geometric',
    slug: 'geometric',
    displayOrder: 6,
    image: '/images/shapes/geometric.png',
  },
];

async function main() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Connected!');

  // Clear previous shapes first to make sure there are no SVG vs image conflicts
  await Shape.deleteMany({});
  console.log('Cleared existing shapes.');

  for (const shape of shapesToSeed) {
    await Shape.create({
      name: shape.name,
      slug: shape.slug,
      image: shape.image,
      displayOrder: shape.displayOrder,
      status: 'Active',
      isDeleted: false,
    });
    console.log(`Seeded shape: ${shape.name}`);
  }

  console.log('Shapes seeding completed successfully!');
  await mongoose.disconnect();
  console.log('Disconnected!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
