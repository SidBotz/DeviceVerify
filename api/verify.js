const connectToDatabase = require('../utils/db');
const Device = require('../models/Device');

export default async function handler(req, res) {
    const { userId, deviceId } = req.body;

    if (!userId || !deviceId) {
        return res.status(400).json({ success: false, message: "Invalid request: Missing userId or deviceId." });
    }

    try {
        await connectToDatabase();

        // Check if the device is already in the database
        const existingDevice = await Device.findOne({ deviceId });

        if (existingDevice) {
            if (existingDevice.userId === userId) {
                return res.status(200).json({ success: true, message: "Verified successfully." });
            } else {
                return res.status(403).json({
                    success: false,
                    message: "Failed to verify. One device can only be linked to one account."
                });
            }
        }

        // If the device is not in the database, add it
        await Device.create({ deviceId, userId });
        return res.status(200).json({ success: true, message: "Verified successfully." });
    } catch (error) {
        console.error("Error in verification:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}
