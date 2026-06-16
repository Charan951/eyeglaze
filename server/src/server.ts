import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './lib/mongodb';
import app from './app';

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`EyeGlaze Express server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
