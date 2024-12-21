
const { MongoClient } = require("mongodb");

const MONGODB_URI = "mongodb+srv://vivekrajroy705:qKzW1QUZWhdZ3nTG@cluster0.djx5h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your MongoDB URI
const DB_NAME = "device_verify"; // Database name
const COLLECTION_NAME = "user_tasks"; // Collection name

let cachedClient = null;

// Connect to MongoDB
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
    // Extract query parameters
    const { userid, linktype, redirectlink } = req.query;

    // Check if parameters are missing
    if (!userid || !linktype || !redirectlink) {
      console.error("Missing parameters:", { userid, linktype, redirectlink });
      return res.status(400).json({ error: "Missing userid, linktype, or redirectlink." });
    }

    // Decode redirectlink
    const decodedRedirectLink = decodeURIComponent(redirectlink);
    console.log("Decoded redirect link:", decodedRedirectLink);

    // Connect to the database
    const db = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);

    // Get user's IP address
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "unknown";
    const time = new Date().toISOString();
    console.log("User details:", { ip, userid, linktype });

    // Check if the IP and linktype already exist in the database
    const existingEntry = await collection.findOne({ ip, linktype });
    if (existingEntry) {
      console.log("Existing entry found:", existingEntry);
      return res.status(403).json({
        status: "Failed",
        message: "You have already completed this task. Try another task or use a different device.",
      });
    }

    // Save user details to the database
    await collection.insertOne({ userid, ip, time, linktype, redirectlink: decodedRedirectLink });
    console.log("New entry saved successfully.");

    // Conditional redirection based on the link type
    let finalRedirectLink = decodedRedirectLink;

    // Case 1: Check if the link is a Telegram link (starts with "https://t.me/")
    if (decodedRedirectLink.startsWith("https://t.me/")) {
      finalRedirectLink = decodedRedirectLink;  // Direct redirection to the Telegram link
    }
    // Case 2: If it's a custom domain (e.g., "botxhub.tech")
    else if (decodedRedirectLink.startsWith("http://botxhub.tech") || decodedRedirectLink.startsWith("https://botxhub.tech")) {
      finalRedirectLink = decodedRedirectLink + "/sid";  // Append /sid to the custom domain
    }
    // Default redirection if no match is found
    else {
      finalRedirectLink = "http://default.redirect/link";  // Default redirect link
    }

    // Log the final redirect link for debugging
    console.log("Redirecting user to:", finalRedirectLink);

    // Redirect the user to the final link
    res.writeHead(302, { Location: finalRedirectLink });
    res.end();
  } catch (error) {
    console.error("Error in redirect.js:", error);

    // Return error details as a response for debugging
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
