const mongoose = require("mongoose");

const TenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    phone: {                 // <-- added phone field
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    roomNumber: {
        type: String,
        required: true
    },

    status: {
        type: String,
        default: "active"
    },

    role: {
        type: String,
        default: "tenant"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Tenant", TenantSchema);