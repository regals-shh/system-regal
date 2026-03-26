const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    resetCode: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        enum: ['tenant', 'admin'],
        required: true
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: 600 // 10 minutes
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
