const express = require("express");
const router = express.Router();
const VisitorLog = require("../models/VisitorLog");
const Tenant = require("../models/Tenant");
const mongoose = require("mongoose");

// Middleware to parse JSON
router.use(express.json());

/* =========================
   GET ALL VISITOR LOGS (ADMIN)
========================= */
router.get("/visitors", async (req, res) => {
    try {
        const visitors = await VisitorLog.find()
            .populate('tenantId', 'name')
            .populate('registeredBy', 'name')
            .sort({ checkInTime: -1 });
        
        res.json(visitors);
    } catch (error) {
        console.error("Error fetching visitors:", error);
        res.status(500).json({ error: "Failed to fetch visitors" });
    }
});

/* =========================
   GET VISITOR LOGS BY TENANT (TENANT)
========================= */
router.get("/tenant-visitors", async (req, res) => {
    try {
        const tenantId = req.query.tenantId;
        if (!tenantId) {
            return res.status(400).json({ error: "Tenant ID required" });
        }

        // Convert string tenantId to ObjectId for MongoDB query
        const objectId = new mongoose.Types.ObjectId(tenantId);
        const visitors = await VisitorLog.find({ tenantId: objectId })
            .sort({ checkInTime: -1 });
        
        res.json(visitors);
    } catch (error) {
        console.error("Error fetching tenant visitors:", error);
        res.status(500).json({ error: "Failed to fetch tenant visitors" });
    }
});

/* =========================
   ADD NEW VISITOR (TENANT)
========================= */
router.post("/add-visitor", async (req, res) => {
    try {
        console.log("=== ADD VISITOR DEBUG ===");
        console.log("Request body:", req.body);
        
        const { visitorName, tenantId, tenantName, roomNumber } = req.body;
        
        if (!visitorName || !tenantId) {
            console.log("Missing required fields");
            return res.status(400).json({ error: "Visitor name and tenant ID required" });
        }

        console.log("Converting tenantId to ObjectId:", tenantId);
        
        // Convert string tenantId to ObjectId for MongoDB
        let objectId;
        try {
            objectId = new mongoose.Types.ObjectId(tenantId);
            console.log("ObjectId created successfully:", objectId);
        } catch (error) {
            console.error("ObjectId conversion failed:", error);
            return res.status(400).json({ error: "Invalid tenant ID format" });
        }

        // Create visitor with tenant info from frontend
        const newVisitor = new VisitorLog({
            visitorName: visitorName,
            tenantId: objectId,
            tenantName: tenantName || "Unknown Tenant",
            roomNumber: roomNumber || "Unknown Room",
            purpose: "General Visit", // Required field
            checkInTime: new Date(),
            status: "checked_in"
        });

        console.log("Saving visitor to database...");
        await newVisitor.save();
        console.log("Visitor saved successfully:", newVisitor);
        
        res.status(201).json({ 
            message: "Visitor added successfully",
            visitor: newVisitor 
        });
    } catch (error) {
        console.error("Error adding visitor:", error);
        res.status(500).json({ error: "Failed to add visitor: " + error.message });
    }
});

/* =========================
   CHECK OUT VISITOR (TENANT)
========================= */
router.put("/checkout-visitor/:id", async (req, res) => {
    try {
        const visitor = await VisitorLog.findByIdAndUpdate(
            req.params.id,
            { 
                checkOutTime: new Date(),
                status: "checked_out"
            },
            { new: true }
        );

        if (!visitor) {
            return res.status(404).json({ error: "Visitor not found" });
        }

        res.json({ 
            message: "Visitor checked out successfully",
            visitor: visitor 
        });
    } catch (error) {
        console.error("Error checking out visitor:", error);
        res.status(500).json({ error: "Failed to check out visitor" });
    }
});

/* =========================
   UPDATE VISITOR (TENANT)
========================= */
router.put("/update-visitor/:id", async (req, res) => {
    try {
        const { visitorName } = req.body;
        
        const visitor = await VisitorLog.findByIdAndUpdate(
            req.params.id,
            { visitorName },
            { new: true }
        );

        if (!visitor) {
            return res.status(404).json({ error: "Visitor not found" });
        }

        res.json({ 
            message: "Visitor updated successfully",
            visitor: visitor 
        });
    } catch (error) {
        console.error("Error updating visitor:", error);
        res.status(500).json({ error: "Failed to update visitor" });
    }
});

/* =========================
   DELETE VISITOR (ADMIN)
========================= */
router.delete("/delete-visitor/:id", async (req, res) => {
    try {
        const visitor = await VisitorLog.findByIdAndDelete(req.params.id);

        if (!visitor) {
            return res.status(404).json({ error: "Visitor not found" });
        }

        res.json({ 
            message: "Visitor deleted successfully",
            visitor: visitor 
        });
    } catch (error) {
        console.error("Error deleting visitor:", error);
        res.status(500).json({ error: "Failed to delete visitor" });
    }
});

module.exports = router;
