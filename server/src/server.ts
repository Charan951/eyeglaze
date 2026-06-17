import 'dotenv/config';
import http from 'http';

import { connectDB } from './config/mongodb';
import { startInMemoryMongoDB } from './config/inMemoryMongo';
import { seedDatabase } from './lib/seedDatabase';
import { initSocket } from './lib/socket';
import app from './app';

const PORT = process.env.PORT || 5000;

async function main() {
  try {
    console.log('--- Server Startup Debug ---');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('MONGODB_URI present?:', !!process.env.MONGODB_URI);
    console.log('MONGODB_URI value:', process.env.MONGODB_URI);

    if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'development') {
      const inMemoryUri = await startInMemoryMongoDB();
      process.env.MONGODB_URI = inMemoryUri;
    }
    
    await connectDB();
    await seedDatabase();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`EyeGlaze Express server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

main();
