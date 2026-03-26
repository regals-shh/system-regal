const mongoose = require("mongoose");

const systemLogSchema = new mongoose.Schema({
    event: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ["security", "error", "backup", "maintenance", "performance"],
        required: true
    },
    severity: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium"
    },
    message: {
        type: String,
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    resolved: {
        type: Boolean,
        default: false
    },
    resolvedAt: {
        type: Date,
        required: false
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: false
    }
});

module.exports = mongoose.model("SystemLog", systemLogSchema);
