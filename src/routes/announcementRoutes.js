const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");

// ===============================
// CREATE ANNOUNCEMENT (ADMIN)
// ===============================
router.post("/post-announcement", async(req,res)=>{
    try {
        const {title, message, priority} = req.body;
        const newAnnouncement = new Announcement({
            title,
            message,
            priority: priority || "normal"
        });
        await newAnnouncement.save();
        res.json({message: "Announcement posted successfully"});
    } catch(error) {
        console.error("Post Announcement Error:", error);
        res.status(500).json({message: "Server error"});
    }
});

// ===============================
// GET ALL ANNOUNCEMENTS (TENANT & APP)
// ===============================
router.get("/announcements", async(req,res)=>{
    try {
        const announcements = await Announcement.find().sort({createdAt: -1});
        res.json(announcements);
    } catch(error) {
        console.error("Get Announcements Error:", error);
        res.status(500).json({message: "Server error"});
    }
});

// ===============================
// MARK AS SEEN (TENANT & APP)
// ===============================
router.post("/announcement-seen/:id", async(req,res)=>{
    try {
        const {tenantId, name} = req.body;
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).json({message: "Not found"});

        const alreadySeen = announcement.seenBy.find(s => s.tenantId.toString() === tenantId);
        if(!alreadySeen){
            announcement.seenBy.push({ tenantId, name });
            await announcement.save();
        }
        res.json({message: "Marked as seen"});
    } catch(error) {
        res.status(500).json({message: "Server error"});
    }
});

// ===============================
// UPDATE ANNOUNCEMENT (ADMIN)
// ===============================
router.put("/update-announcement/:id", async(req,res)=>{
    try {
        const {title, message, priority} = req.body;
        const announcement = await Announcement.findByIdAndUpdate(
            req.params.id,
            {title, message, priority},
            {new: true, runValidators: true}
        );
        
        if (!announcement) {
            return res.status(404).json({message: "Announcement not found"});
        }
        
        res.json({message: "Announcement updated successfully"});
    } catch(error) {
        console.error("Update Announcement Error:", error);
        res.status(500).json({message: "Server error"});
    }
});

// ===============================
// DELETE ANNOUNCEMENT (ADMIN)
// ===============================
router.delete("/delete-announcement/:id", async(req,res)=>{
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({message: "Announcement deleted"});
    } catch(error) {
        res.status(500).json({message: "Server error"});
    }
});

module.exports = router;