const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const SECRET_KEY = 'supersecretkey';

/* =========================
   AUTH MIDDLEWARE
========================= */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.admin = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

/* =========================
   CREATE UPLOAD FOLDER
========================= */

const uploadFolder = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadFolder)) {
fs.mkdirSync(uploadFolder);
}

/* =========================
   FILE UPLOAD CONFIG
========================= */

const storage = multer.diskStorage({

destination: function (req, file, cb) {
cb(null, uploadFolder);
},

filename: function (req, file, cb) {

const uniqueName =
Date.now() + "-" + Math.round(Math.random() * 1E9);

cb(null, uniqueName + path.extname(file.originalname));

}

});

const upload = multer({
storage: storage,
limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/* =========================
   CREATE INVOICE
========================= */

router.post("/create-invoice", authenticate, async (req,res)=>{

try{

console.log("=== CREATE INVOICE DEBUG ===");
console.log("Request body:", req.body);

const {
tenantId,
tenantName,
roomNumber,
amount,
description,
dueDate
} = req.body;

console.log("Extracted fields:");
console.log("- tenantId:", tenantId);
console.log("- tenantName:", tenantName);
console.log("- roomNumber:", roomNumber);
console.log("- amount:", amount);
console.log("- description:", description);
console.log("- dueDate:", dueDate);

const missingFields = [];
if (!tenantName) missingFields.push("tenantName");
if (!roomNumber) missingFields.push("roomNumber");
if (!amount) missingFields.push("amount");
if (!dueDate) missingFields.push("dueDate");

if (missingFields.length > 0) {
    console.log("Missing required fields:", missingFields);
    return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
}

const invoice = new Invoice({

tenantId: tenantId
? new mongoose.Types.ObjectId(tenantId)
: undefined,

tenantName,
roomNumber,
amount: Number(amount),
description,
dueDate,
status:"Pending"

});

console.log("Invoice object before save:", invoice);
console.log("Invoice validation errors:", invoice.validateSync());

await invoice.save();

console.log("Invoice saved successfully:", invoice);

res.json({
message:"Invoice created successfully",
invoice: invoice
});

}catch(error){

console.error("=== CREATE INVOICE ERROR ===");
console.error("Error name:", error.name);
console.error("Error message:", error.message);
console.error("Error stack:", error.stack);

if (error.name === 'ValidationError') {
    console.error("Validation errors:");
    Object.keys(error.errors).forEach(key => {
        console.error(`- ${key}: ${error.errors[key].message}`);
    });
}

res.status(500).json({
error:"Invoice creation failed: " + error.message
});

}

});

/* =========================
   GET ALL INVOICES (ADMIN)
========================= */

router.get("/invoices", authenticate, async (req,res)=>{

try{

const invoices =
await Invoice.find().sort({createdAt:-1});

res.json(invoices);

}catch(error){

console.error(error);

res.status(500).json({
error:"Failed to fetch invoices"
});

}

});

/* =========================
   GET TENANT INVOICES
========================= */

router.get("/tenant-invoices/:roomNumber", async (req,res)=>{

try{

const invoices = await Invoice.find({
roomNumber: req.params.roomNumber
}).sort({createdAt:-1});

res.json(invoices);

}catch(error){

console.error(error);

res.status(500).json({
error:"Failed to fetch tenant invoices"
});

}

});

/* =========================
   GET TENANT INVOICES BY ID
========================= */

router.get("/tenant-invoices-by-id/:tenantId", async (req,res)=>{

try{

const invoices = await Invoice.find({
tenantId: req.params.tenantId
}).sort({createdAt:-1});

res.json(invoices);

}catch(error){

console.error(error);

res.status(500).json({
error:"Failed to fetch tenant invoices by ID"
});

}

});

/* =========================
   UPLOAD PAYMENT PROOF
========================= */

router.post(
"/upload-payment/:id",
upload.single("proof"),
async (req,res)=>{

try{

if(!req.file){

return res.status(400).json({
error:"No file uploaded"
});

}

const invoice =
await Invoice.findById(req.params.id);

if(!invoice){

return res.status(404).json({
error:"Invoice not found"
});

}

/* DELETE OLD PROOF */

if(invoice.proofImage){

const oldPath =
path.join(uploadFolder, invoice.proofImage);

if(fs.existsSync(oldPath)){
fs.unlinkSync(oldPath);
}

}

/* SAVE NEW PROOF */

invoice.proofImage = req.file.filename;
invoice.status = "Pending";

await invoice.save();

res.json({

message:"Proof uploaded successfully",
file:req.file.filename

});

}catch(error){

console.error(error);

res.status(500).json({
error:"Upload failed"
});

}

});

/* =========================
   DELETE PAYMENT PROOF
========================= */

router.delete("/delete-proof/:id", async (req,res)=>{

try{

console.log("Delete proof request for invoice:", req.params.id);

const invoice =
await Invoice.findById(req.params.id);

if(!invoice){

console.log("Invoice not found:", req.params.id);
return res.status(404).json({
error:"Invoice not found"
});

}

console.log("Invoice before deletion:", {
    id: invoice._id,
    proofImage: invoice.proofImage,
    status: invoice.status
});

/* REMOVE FILE */

if(invoice.proofImage){

const filePath =
path.join(uploadFolder, invoice.proofImage);

if(fs.existsSync(filePath)){
console.log("Deleting file:", filePath);
fs.unlinkSync(filePath);
} else {
    console.log("File not found:", filePath);
}

}

/* CLEAR DATABASE */

invoice.proofImage = null;
invoice.status = "Unpaid";

await invoice.save();

console.log("Invoice after deletion:", {
    id: invoice._id,
    proofImage: invoice.proofImage,
    status: invoice.status
});

res.json({
message:"Proof deleted successfully",
invoice: {
    id: invoice._id,
    proofImage: invoice.proofImage,
    status: invoice.status
}
});

}catch(error){

console.error("Delete proof error:", error);

res.status(500).json({
error:"Delete failed"
});

}

});

/* =========================
   VERIFY PAYMENT (ADMIN)
========================= */

router.put("/verify-payment/:id", authenticate, async (req,res)=>{

try{

await Invoice.findByIdAndUpdate(
req.params.id,
{ status:"Paid" }
);

res.json({
message:"Payment verified"
});

}catch(error){

console.error(error);

res.status(500).json({
error:"Verification failed"
});

}

});

/* =========================
   UPDATE INVOICE
========================= */

router.put("/update-invoice/:id", authenticate, async (req,res)=>{

try{

await Invoice.findByIdAndUpdate(
req.params.id,
req.body
);

res.json({
message:"Invoice updated successfully"
});

}catch(error){

console.error(error);

res.status(500).json({
error:"Update failed"
});

}

});

/* =========================
   DELETE INVOICE
========================= */

router.delete("/delete-invoice/:id", authenticate, async (req,res)=>{

try{

const invoice =
await Invoice.findById(req.params.id);

if(invoice && invoice.proofImage){

const filePath =
path.join(uploadFolder, invoice.proofImage);

if(fs.existsSync(filePath)){
fs.unlinkSync(filePath);
}

}

await Invoice.findByIdAndDelete(req.params.id);

res.json({
message:"Invoice deleted successfully"
});

}catch(error){

console.error(error);

res.status(500).json({
error:"Delete failed"
});

}

});

module.exports = router;