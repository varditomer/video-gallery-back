import { MongoClient, Collection, Db, ServerApiVersion } from 'mongodb';

// Get MongoDB connection details from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/video-gallery';
const DB_NAME = process.env.DB_NAME || 'video-gallery';

// MongoDB connection options
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
};

// Singleton pattern for MongoDB connection
let client: MongoClient | null = null;
let dbInstance: Db | null = null;

/**
 * Connect to MongoDB if not already connected
 */
async function connect(): Promise<Db> {
  // Return existing connection if available
  if (dbInstance) return dbInstance;
  
  try {
    // Create new client if needed
    if (!client) {
      console.log('Creating new MongoDB client connection to:', MONGODB_URI);
      client = new MongoClient(MONGODB_URI, options);
    }
    
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get database instance
    dbInstance = client.db(DB_NAME);
    return dbInstance;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Get a MongoDB collection
 * @param collectionName The name of the collection
 * @returns The MongoDB collection
 */
async function getCollection<T extends Document = any>(collectionName: string): Promise<Collection<T>> {
  try {
    const db = await connect();
    return db.collection<T>(collectionName);
  } catch (error) {
    console.error(`Failed to get collection "${collectionName}":`, error);
    throw error;
  }
}

/**
 * Close the MongoDB connection
 */
async function disconnect(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    dbInstance = null;
    console.log('Disconnected from MongoDB');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

export const dbService = {
  connect,
  getCollection,
  disconnect
};
