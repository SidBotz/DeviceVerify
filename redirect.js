const { MongoClient } = require("mongodb");
const crypto = require("crypto");

// MongoDB configuration
const MONGODB_URI = "mongodb+srv://vivekrajroy705:qKzW1QUZWhdZ3nTG@cluster0.djx5h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your MongoDB URI
const DB_NAME = "device_verify";
const COLLECTION_NAME = "user_tasks";

// Connect to MongoDB
let cachedClient = null;
async function connectToDatabase() {
  if (!cachedClient) {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    cachedClient = client;
  }
  return cachedClient.db(DB_NAME);
}

module.exports = async (req, res) => {
  try {
    const { userid, linktype, redirectlink } = req.query;

    if (!userid || !linktype || !redirectlink) {
      return res.status(400).json({ error: "Missing userid, linktype, or redirectlink." });
    }

    const db = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "unknown";
    const time = new Date().toISOString();

    // Check if the IP has already completed this linktype
    const existingEntry = await collection.findOne({ ip, linktype });
    if (existingEntry) {
      return res.status(403).json({
        status: "Failed",
        message: "You have already completed this task. Try another task or use a different device.",
      });
    }

    // Save user details to the database
    await collection.insertOne({ userid, ip, time, linktype, redirectlink });

    // Redirect the user to the redirect link
    res.writeHead(302, { Location: redirectlink });
    res.end();
  } catch (error) {
    console.error("Error in redirect.js:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
