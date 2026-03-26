const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
        required: true
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },
    amountPaid: {
        type: Number,
        required: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ["cash", "bank_transfer", "gcash", "maya", "credit_card"],
        required: true
    },
    transactionId: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ["completed", "failed", "pending"],
        default: "completed"
    },
    proofImage: {
        type: String,
        required: false
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: false
    },
    verifiedAt: {
        type: Date,
        required: false
    },
    notes: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model("Payment", paymentSchema);
