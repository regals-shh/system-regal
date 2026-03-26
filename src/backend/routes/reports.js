const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice"); // your Invoice model
const Room = require("../models/Room");       // your Room model

// ===============================
// YEAR-TO-DATE REVENUE
// ===============================
router.get("/revenue", async (req, res) => {
    try {
        const paidInvoices = await Invoice.find({ status: "Paid" });
        const total = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

        // Example: trend calculation (replace with your logic)
        const trend = 12;

        res.json({ total, trend });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// ===============================
// AVERAGE OCCUPANCY
// ===============================
router.get("/occupancy", async (req, res) => {
    try {
        const rooms = await Room.find();
        const totalRooms = rooms.length;
        const occupiedRooms = rooms.filter(r => r.status === "Occupied").length;
        const average = totalRooms === 0 ? 0 : (occupiedRooms / totalRooms) * 100;

        // Example trend (replace with your logic)
        const trend = 3;

        res.json({ average, trend });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// ===============================
// MONTHLY TRANSACTIONS
// ===============================
router.get("/monthly-transactions", async (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Get all invoices for current month
        const monthlyInvoices = await Invoice.find({
            $expr: {
                $and: [
                    { $expr: { $eq: [{ $month: "$createdAt" }, currentMonth] } },
                    { $expr: { $eq: [{ $year: "$createdAt" }, currentYear] } }
                ]
            }
        });
        
        const total = monthlyInvoices.length;
        
        // Calculate trend (compare with last month)
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        const lastMonthInvoices = await Invoice.find({
            $expr: {
                $and: [
                    { $expr: { $eq: [{ $month: "$createdAt" }, lastMonth] } },
                    { $expr: { $eq: [{ $year: "$createdAt" }, lastMonthYear] } }
                ]
            }
        });
        
        const lastMonthTotal = lastMonthInvoices.length;
        const trend = lastMonthTotal === 0 ? 0 : ((total - lastMonthTotal) / lastMonthTotal) * 100;

        res.json({ total, trend });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// ===============================
// PENDING PAYMENTS
// ===============================
router.get("/pending-payments", async (req, res) => {
    try {
        const pendingInvoices = await Invoice.find({ status: "Pending" });
        const total = pendingInvoices.length;

        res.json({ total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;