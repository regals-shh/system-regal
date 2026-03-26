const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Tenant = require("../models/Tenant");
const Room = require("../models/Room");

const SECRET_KEY = 'supersecretkey';

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


// ===============================
// ADD TENANT (ADMIN)
// ===============================
router.post("/add-tenant", async (req, res) => {
  try {

    const { name, email, phone, password, roomNumber } = req.body;

    if (!name || !email || !phone || !password || !roomNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingTenant = await Tenant.findOne({ email });
    if (existingTenant) {
      return res.status(400).json({ message: "Tenant already exists" });
    }

    // Check if room exists
    const room = await Room.findOne({ roomNumber });
    if (!room) {
      return res.status(400).json({ message: "Room does not exist" });
    }

    // Check if room already occupied
    if (room.status === "Occupied") {
      return res.status(400).json({ message: "Room already occupied" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTenant = new Tenant({
      name,
      email,
      phone,
      password: hashedPassword,
      roomNumber
    });

    await newTenant.save();

    // Mark room as occupied
    room.status = "Occupied";
    await room.save();

    res.status(201).json({
      message: "Tenant created successfully"
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ message: "Server error" });

  }
});


// ===============================
// TENANT LOGIN
// ===============================
router.post("/tenant-login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const tenant = await Tenant.findOne({ email });

    if (!tenant) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, tenant.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    res.status(200).json({
      message: "Login successful",
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        roomNumber: tenant.roomNumber
      }
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ message: "Server error" });

  }

});


// ===============================
// GET ALL TENANTS
// ===============================
router.get("/tenants", authenticate, async (req, res) => {

  try {

    const tenants = await Tenant.find();

    res.status(200).json(tenants);

  } catch (error) {

    console.error(error);
    res.status(500).json({ message: "Server error" });

  }

});


// ===============================
// GET SINGLE TENANT
// ===============================
router.get("/tenants/:id", async (req, res) => {

  try {

    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found"
      });
    }

    res.json(tenant);

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Server error" });

  }

});


// ===============================
// UPDATE TENANT
// ===============================
router.put("/update-tenant/:id", async (req, res) => {

  try {

    const tenantId = req.params.id;

    const { name, email, phone, roomNumber } = req.body;

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found"
      });
    }

    const oldRoom = tenant.roomNumber;

    tenant.name = name;
    tenant.email = email;
    tenant.phone = phone;
    tenant.roomNumber = roomNumber;

    await tenant.save();

    // If tenant changed room
    if (oldRoom !== roomNumber) {

      // Free old room
      await Room.findOneAndUpdate(
        { roomNumber: oldRoom },
        { status: "Available" }
      );

      // Occupy new room
      await Room.findOneAndUpdate(
        { roomNumber: roomNumber },
        { status: "Occupied" }
      );

    }

    res.json({
      message: "Tenant updated successfully"
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ message: "Server error" });

  }

});


// ===============================
// DELETE TENANT
// ===============================
router.delete("/delete-tenant/:id", async (req, res) => {

  try {

    const tenantId = req.params.id;

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found"
      });
    }

    // Free the room
    await Room.findOneAndUpdate(
      { roomNumber: tenant.roomNumber },
      { status: "Available" }
    );

    await Tenant.findByIdAndDelete(tenantId);

    res.json({
      message: "Tenant deleted successfully"
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ message: "Server error" });

  }

});


// ===============================
// CHANGE PASSWORD
// ===============================
router.put("/change-password/:id", async (req, res) => {

  try {

    const tenantId = req.params.id;

    const { currentPass, newPass } = req.body;

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found"
      });
    }

    const isMatch = await bcrypt.compare(currentPass, tenant.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect"
      });
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);

    tenant.password = hashedPassword;

    await tenant.save();

    res.json({
      message: "Password updated successfully"
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Server error" });

  }

});


module.exports = router;