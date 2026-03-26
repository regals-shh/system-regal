const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema({
    tenantName: { type: String, required: true },
    unit: { type: String, required: true },
    type: { type: String, required: true, enum: ["Parking", "Rooftop"] },
    details: { type: String },
    date: { type: Date, default: Date.now },
    schedule: {
        date: Date,
        time: String,
    },
    vehicle: { type: String },
    plateNumber: { type: String },
    status: { type: String, default: "Pending", enum: ["Pending", "Approved", "Denied"] },
    denialReason: { type: String, default: "" } // NEW: store denial description
});

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);