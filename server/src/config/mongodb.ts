import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  indexesReady?: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null, indexesReady: false };
global.mongoose = cached;

export async function connectDB() {
  if (!cached.conn) {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
    }

    cached.conn = await cached.promise;
  }

  if (!cached.indexesReady) {
    cached.indexesReady = true;
    const { ensureCategoryIndexes } = await import('../models/ensureCategoryIndexes');
    await ensureCategoryIndexes().catch((err) => {
      console.error('Category index sync failed:', err);
    });
  }

  return cached.conn;
}
