const express = require("express");
const router = express.Router();
const ServiceRequest = require("../models/ServiceRequest");

// ============================
// TENANT: Create Service Request
// ============================
router.post("/request-service", async (req,res) => {
    try {
        const { tenantName, unit, type, details, schedule, vehicle, plateNumber } = req.body;

        const request = new ServiceRequest({
            tenantName,
            unit,
            type,
            details,
            schedule,
            vehicle,
            plateNumber
        });

        await request.save();
        res.json({ message: "Service request submitted successfully", request });
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ============================
// TENANT: Get Own Requests
// ============================
router.get("/my-services/:tenantName", async (req,res) => {
    try {
        const requests = await ServiceRequest.find({ tenantName: req.params.tenantName }).sort({ date: -1 });
        res.json(requests);
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ============================
// ADMIN: Get All Requests
// ============================
router.get("/services", async (req,res) => {
    try {
        const requests = await ServiceRequest.find().sort({ date: -1 });
        res.json(requests);
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ============================
// TENANT: Update Service Request
// ============================
router.put("/service/:id", async (req,res) => {
    try {
        const { type, details, schedule, vehicle, plateNumber } = req.body;
        
        const update = { type, details, schedule };
        if (vehicle) update.vehicle = vehicle;
        if (plateNumber) update.plateNumber = plateNumber;
        
        const request = await ServiceRequest.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true, runValidators: true }
        );
        
        if(!request) return res.status(404).json({ message: "Request not found" });
        
        res.json({ message: "Service request updated successfully", request });
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ============================
// ADMIN: Update Status (Approve/Deny)
// ============================
router.put("/service/:id/status", async (req,res) => {
    try {
        const { status, denialReason } = req.body;
        if(!["Approved","Denied"].includes(status)){
            return res.status(400).json({ message: "Invalid status" });
        }

        const update = { status };
        if(status==="Denied" && denialReason) update.denialReason = denialReason;

        const request = await ServiceRequest.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );

        if(!request) return res.status(404).json({ message: "Request not found" });

        res.json({ message: `Service request ${status.toLowerCase()}`, request });
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ============================
// ADMIN: Delete Request
// ============================
router.delete("/service/:id", async (req,res) => {
    try {
        const request = await ServiceRequest.findByIdAndDelete(req.params.id);
        if(!request) return res.status(404).json({ message: "Request not found" });
        res.json({ message: "Service request deleted" });
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
