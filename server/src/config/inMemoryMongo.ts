import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export async function startInMemoryMongoDB() {
  if (mongod) return mongod.getUri();
  
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log('In-memory MongoDB started at:', uri);
  return uri;
}

export async function stopInMemoryMongoDB() {
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}
