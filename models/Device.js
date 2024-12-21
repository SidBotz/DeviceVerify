const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
});

module.exports = mongoose.models.Device || mongoose.model('Device', DeviceSchema);
