const express = require("express");
const router = express.Router();

const Room = require("../models/Room");
const RoomType = require("../models/RoomType");

// =======================
// GET ROOM TYPES
// =======================
router.get("/room-types", async (req,res)=>{
  try{
    const types = await RoomType.find();
    res.json(types);
  }catch(error){
    res.status(500).json({message:"Server error"});
  }
});

// =======================
// GET SINGLE ROOM TYPE
// =======================
router.get("/room-types/:id", async (req,res)=>{
  try{
    const type = await RoomType.findById(req.params.id);
    if(!type) return res.status(404).json({message:"Room type not found"});
    res.json(type);
  }catch(error){
    res.status(500).json({message:"Server error"});
  }
});

// =======================
// ADD ROOM TYPE
// =======================
router.post("/add-room-type", async (req,res)=>{
  try{
    const { name, price, description, features } = req.body;
    const type = new RoomType({ name, price, description, features });
    await type.save();
    res.json({message:"Room type created"});
  }catch(error){
    res.status(500).json({message:"Server error"});
  }
});

// =======================
// UPDATE ROOM TYPE
// =======================
router.put("/update-room-type/:id", async(req,res)=>{
  try{
    const { name, price, description, features } = req.body;
    const updated = await RoomType.findByIdAndUpdate(
      req.params.id,
      { name, price, description, features },
      { new: true }
    );
    if(!updated) return res.status(404).json({message:"Room type not found"});
    res.json({message:"Room type updated"});
  }catch(err){
    res.status(500).json({message:"Server error"});
  }
});

// =======================
// DELETE ROOM TYPE
// =======================
router.delete("/delete-room-type/:id", async(req,res)=>{
  try{
    // Delete all rooms under this type first
    await Room.deleteMany({ type: req.params.id });
    // Delete the type
    await RoomType.findByIdAndDelete(req.params.id);
    res.json({message:"Room type and its rooms deleted"});
  }catch(err){
    res.status(500).json({message:"Server error"});
  }
});

// =======================
// GET ROOMS
// =======================
router.get("/rooms", async (req,res)=>{
  try{
    const rooms = await Room.find().populate("type");
    res.json(rooms);
  }catch(error){
    res.status(500).json({message:"Server error"});
  }
});

// =======================
// ADD ROOM
// =======================
router.post("/add-room", async (req,res)=>{
  try{
    const { roomNumber, type } = req.body;
    const room = new Room({ roomNumber, type });
    await room.save();
    res.json({message:"Room created"});
  }catch(error){
    res.status(500).json({message:"Server error"});
  }
});

// =======================
// UPDATE ROOM
// =======================
router.put("/update-room/:id", async(req,res)=>{
  try{
    const { roomNumber, type } = req.body;
    await Room.findByIdAndUpdate(req.params.id,{ roomNumber, type });
    res.json({message:"Room updated"});
  }catch(err){
    res.status(500).json({message:"Server error"});
  }
});

// =======================
// DELETE ROOM
// =======================
router.delete("/delete-room/:id", async(req,res)=>{
  try{
    await Room.findByIdAndDelete(req.params.id);
    res.json({message:"Room deleted"});
  }catch(err){
    res.status(500).json({message:"Server error"});
  }
});

module.exports = router;