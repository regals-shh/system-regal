const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const RoomType = require('../models/RoomType'); // your RoomType model
const Room = require('../models/Room');
const Invoice = require('../models/Invoice');
const Maintenance = require('../models/Maintenance');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'supersecretkey'; // Change for production

/* =========================
   LOGIN ROUTE
========================= */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await admin.matchPassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            SECRET_KEY,
            { expiresIn: '8h' }
        );

        res.json({
            _id: admin._id,
            email: admin.email,
            full_name: admin.full_name,
            role: admin.role,
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

/* =========================
   AUTH MIDDLEWARE
========================= */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.admin = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
}

/* =========================
   DASHBOARD ROUTE
========================= */
router.get('/dashboard', authenticate, async (req, res) => {
    try {
        const totalUnits = await Room.countDocuments();
        const occupiedUnits = await Room.countDocuments({ status: 'Occupied' });
        const vacantUnits = totalUnits - occupiedUnits;

        const invoices = await Invoice.find({ status: 'Paid' });
        const revenue = invoices.reduce((sum, i) => sum + i.amount, 0);

        const pendingTasks = await Maintenance.countDocuments({ status: 'Pending' });

        const recentPaymentsRaw = await Invoice.find()
            .sort({ datePaid: -1 })
            .limit(10);

        const recentPayments = recentPaymentsRaw.map(inv => ({
            tenantName: inv.tenantName || 'Unknown Tenant',
            room: inv.roomNumber || 'Unknown Room',
            datePaid: inv.datePaid || inv.updatedAt,
            amount: inv.amount,
            status: inv.status
        }));

        res.json({
            stats: { totalUnits, occupiedUnits, vacantUnits, revenue, pendingTasks },
            recentPayments
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

/* =========================
   ROOM TYPE CRUD ROUTES
========================= */

// GET all rooms
router.get('/rooms', authenticate, async (req, res) => {
    try {
        const rooms = await RoomType.find();
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE room type
router.post('/rooms', authenticate, async (req, res) => {
    try {
        const { name, price, description, features, featured, visible } = req.body;
        const room = new RoomType({ name, price, description, features, featured, visible });
        await room.save();
        res.json(room);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPDATE room type
router.put('/rooms/:id', authenticate, async (req, res) => {
    try {
        const room = await RoomType.findById(req.params.id);
        if (!room) return res.status(404).json({ message: "Room not found" });

        const { name, price, description, features, featured, visible } = req.body;

        room.name = name ?? room.name;
        room.price = price ?? room.price;
        room.description = description ?? room.description;
        room.features = features ?? room.features;
        room.featured = featured ?? room.featured;
        room.visible = visible ?? room.visible;

        await room.save();
        res.json(room);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE room type
router.delete('/rooms/:id', authenticate, async (req, res) => {
    try {
        const room = await RoomType.findByIdAndDelete(req.params.id);
        if (!room) return res.status(404).json({ message: "Room not found" });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;