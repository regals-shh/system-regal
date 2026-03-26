const mongoose = require("mongoose");
const Room = require("./models/Room"); // make sure path is correct

mongoose.connect("mongodb://127.0.0.1:27017/regalrooms")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const rooms = [];

// Create rooms A-101 to A-116
for (let i = 101; i <= 116; i++) {
  rooms.push({
    roomNumber: `A-${i}`,
    type: "Studio",
    price: 5000,
    status: "Available" // Important!
  });
}

async function seed() {
  try {
    await Room.deleteMany(); // remove existing rooms
    await Room.insertMany(rooms);
    console.log("Rooms seeded successfully!");
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

seed();