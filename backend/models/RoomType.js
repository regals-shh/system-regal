const mongoose = require("mongoose");

const RoomTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    description: String,
    features: [String],
    featured: { type: Boolean, default: false }
});

module.exports = mongoose.model("RoomType", RoomTypeSchema);