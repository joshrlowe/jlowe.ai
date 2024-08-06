import { MongoClient } from "mongodb";
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

if (process.env.NODE_ENV === "development") {
  /*
    In development, check for global MongoDB client to reuse the connection.
    If not found, create a new client and store it in global.
   */
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }

  clientPromise = global._mongoClientPromise;
} else {
  // In production, make a new connection for each request.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
