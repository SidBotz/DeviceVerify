const { MongoClient } = require("mongodb");
const crypto = require("crypto");

// MongoDB configuration
const MONGODB_URI = "mongodb+srv://vivekrajroy705:qKzW1QUZWhdZ3nTG@cluster0.djx5h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your MongoDB URI
const DB_NAME = "device_verify";
const COLLECTION_NAME = "devices";

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

// Generate a unique fingerprint for the device
function getDeviceFingerprint(req) {
  const userAgent = req.headers["user-agent"] || "unknown";
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "unknown";
  return crypto.createHash("sha256").update(userAgent + ip).digest("hex");
}

module.exports = async (req, res) => {
  const { userid, url } = req.query;

  if (!userid || !url) {
    return res.status(400).json({ error: "Invalid request. Missing userid or url." });
  }

  try {
    const db = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);

    // Generate the device fingerprint
    const fingerprint = getDeviceFingerprint(req);

    // Check if the device fingerprint exists in the database
    const existingDevice = await collection.findOne({ fingerprint });

    if (existingDevice) {
      if (existingDevice.userid === userid) {
        return res.status(200).json({ status: "Verified", message: "Device and user match." });
      } else {
        return res.status(403).json({ status: "Failed", message: "This device is already associated with another user." });
      }
    } else {
      // Add the new device fingerprint and user ID to the database
      await collection.insertOne({ userid, fingerprint });
      return res.status(200).json({ status: "Verified", message: "Device successfully verified and added." });
    }
  } catch (error) {
    console.error("Error verifying device:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
