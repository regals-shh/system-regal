const express = require("express");
const router = express.Router();

const Message = require("../models/Message");


// ==============================
// SEND MESSAGE (FROM WEBSITE)
// ==============================

router.post("/send-message", async(req,res)=>{

try{

const { name, email, subject, message } = req.body;

const newMessage = new Message({
name,
email,
subject,
message
});

await newMessage.save();

res.json({message:"Message sent successfully"});

}catch(err){

console.log(err);
res.status(500).json({message:"Server error"});

}

});


// ==============================
// GET ALL MESSAGES (ADMIN)
// ==============================

router.get("/messages", async(req,res)=>{

try{

const messages = await Message.find().sort({createdAt:-1});

res.json(messages);

}catch(err){

res.status(500).json({message:"Server error"});

}

});


// ==============================
// UPDATE MESSAGE STATUS
// ==============================

router.patch("/messages/:id", async(req,res)=>{

try{

const { status } = req.body;

if (!status || (status.toLowerCase() !== "read" && status.toLowerCase() !== "unread")) {
    return res.status(400).json({message:"Invalid status"});
}

// Normalize status to lowercase for consistency
const normalizedStatus = status.toLowerCase();

const updatedMessage = await Message.findByIdAndUpdate(
    req.params.id,
    { status: normalizedStatus },
    { new: true }
);

if (!updatedMessage) {
    return res.status(404).json({message:"Message not found"});
}

res.json(updatedMessage);

}catch(err){

console.log(err);
res.status(500).json({message:"Server error"});

}

});


// ==============================
// DELETE MESSAGE
// ==============================

router.delete("/messages/:id", async(req,res)=>{

try{

await Message.findByIdAndDelete(req.params.id);

res.json({message:"Message deleted"});

}catch(err){

res.status(500).json({message:"Server error"});

}

});

module.exports = router;
