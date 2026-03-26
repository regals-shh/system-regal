const mongoose = require("mongoose");

const userSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userType: {
        type: String,
        enum: ["admin", "tenant"],
        required: true
    },
    token: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    },
    loginTime: {
        type: Date,
        default: Date.now
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    logoutTime: {
        type: Date,
        required: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    location: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model("UserSession", userSessionSchema);
