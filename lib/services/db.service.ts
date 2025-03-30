import { MongoClient, Collection, Db, ServerApiVersion } from "mongodb";

// Get MongoDB connection details from environment variables
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/video-gallery";
const DB_NAME = process.env.DB_NAME || "video-gallery";

// MongoDB connection options
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Add reasonable timeouts for serverless environments
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

// For global scope access needed in serverless environments
declare global {
  var _mongoClient: { client: MongoClient | null; db: Db | null; promise: Promise<MongoClient> | null };
}

// Initialize the global connection cache if it doesn't exist
if (!global._mongoClient) {
  global._mongoClient = { client: null, db: null, promise: null };
}

/**
 * Connect to MongoDB with optimizations for serverless environments
 */
async function connect(): Promise<Db> {
  // Return existing DB instance if available
  if (global._mongoClient.db) {
    return global._mongoClient.db;
  }

  try {
    // Use existing connection promise if available
    if (!global._mongoClient.promise) {
      console.log("Creating new MongoDB client connection");
      global._mongoClient.promise = MongoClient.connect(MONGODB_URI, options);
    }

    // Wait for connection
    global._mongoClient.client = await global._mongoClient.promise;
    console.log("Connected to MongoDB");

    // Get database instance
    global._mongoClient.db = global._mongoClient.client.db(DB_NAME);
    return global._mongoClient.db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    // Reset the connection promise so we can retry on next invocation
    global._mongoClient.promise = null;
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
 * Note: In serverless environments, this is rarely needed
 */
async function disconnect(): Promise<void> {
  if (global._mongoClient.client) {
    await global._mongoClient.client.close();
    global._mongoClient.client = null;
    global._mongoClient.db = null;
    global._mongoClient.promise = null;
    console.log("Disconnected from MongoDB");
  }
}

// Only register SIGINT handler in non-serverless environments
if (process.env.NODE_ENV !== "production") {
  process.on("SIGINT", async () => {
    await disconnect();
    process.exit(0);
  });
}

export const dbService = {
  connect,
  getCollection,
  disconnect,
};
