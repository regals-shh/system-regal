const mongoose = require("mongoose");

const visitorLogSchema = new mongoose.Schema({
    visitorName: {
        type: String,
        required: true
    },
    visitorPhone: {
        type: String,
        required: false
    },
    visitorEmail: {
        type: String,
        required: false
    },
    purpose: {
        type: String,
        required: true
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },
    tenantName: {
        type: String,
        required: true
    },
    roomNumber: {
        type: String,
        required: true
    },
    checkInTime: {
        type: Date,
        default: Date.now
    },
    checkOutTime: {
        type: Date,
        required: false
    },
    status: {
        type: String,
        enum: ["checked_in", "checked_out"],
        default: "checked_in"
    },
    notes: {
        type: String,
        required: false
    },
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: false
    }
});

module.exports = mongoose.model("VisitorLog", visitorLogSchema);
