const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI; // MongoDB connection string

module.exports = async (req, res) => {
  try {
    const { userid, url } = req.query;
    console.log("Received Request:", { userid, url }); // Log incoming request

    if (!uri) {
      console.error("MongoDB URI is not defined in environment variables");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db("Cluster0");
    const collection = db.collection("devices");

    // Check if device fingerprint already exists
    const fingerprint = req.headers["x-device-fingerprint"]; // Pass a custom header from frontend
    console.log("Device Fingerprint:", fingerprint);

    if (!fingerprint) {
      console.error("Device fingerprint not provided");
      return res.status(400).json({ error: "Device fingerprint missing" });
    }

    const existingDevice = await collection.findOne({ fingerprint });

    if (existingDevice) {
      if (existingDevice.userid === userid) {
        console.log("User verified successfully");
        return res.status(200).json({ message: "Verified" });
      } else {
        console.warn("Different user trying to use the same device");
        return res
          .status(403)
          .json({ error: "Failed to verify: one device, one account" });
      }
    }

    // Add new device entry
    await collection.insertOne({ userid, fingerprint });
    console.log("New device registered:", { userid, fingerprint });

    res.status(200).json({ message: "Verified and registered" });
  } catch (err) {
    console.error("Error in verify API:", err.message, err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
