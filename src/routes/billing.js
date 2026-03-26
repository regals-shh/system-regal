const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const path = require("path");

const SECRET_KEY = 'supersecretkey';

// GridFS bucket reference (will be set from server.js)
let gridfsBucket;

// Function to set GridFS bucket (called from server.js)
function setGridFSBucket(bucket) {
    gridfsBucket = bucket;
}

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
   FILE UPLOAD CONFIG (MEMORY -> GRIDFS)
========================= */

const storage = multer.memoryStorage();

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
   UPLOAD PAYMENT PROOF (GRIDFS)
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

if (!gridfsBucket) {
    return res.status(500).json({ error: "GridFS not initialized" });
}

const invoice =
await Invoice.findById(req.params.id);

if(!invoice){

return res.status(404).json({
error:"Invoice not found"
});

}

/* DELETE OLD PROOF FROM GRIDFS */

if(invoice.proofImage && gridfsBucket){

try {
    const oldFile = await gridfsBucket.find({ filename: invoice.proofImage }).toArray();
    if (oldFile && oldFile.length > 0) {
        await gridfsBucket.delete(oldFile[0]._id);
    }
} catch (err) {
    console.log("Old file not found or already deleted");
}

}

/* SAVE NEW PROOF TO GRIDFS */

const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(req.file.originalname);

const uploadStream = gridfsBucket.openUploadStream(uniqueName, {
    contentType: req.file.mimetype
});

uploadStream.end(req.file.buffer);

// Wait for upload to complete
await new Promise((resolve, reject) => {
    uploadStream.on('finish', resolve);
    uploadStream.on('error', reject);
});

invoice.proofImage = uniqueName;
invoice.status = "Pending";

await invoice.save();

console.log("Proof uploaded to GridFS:", uniqueName);

res.json({

message:"Proof uploaded successfully",
file:uniqueName

});

}catch(error){

console.error(error);

res.status(500).json({
error:"Upload failed"
});

}

}
);

/* =========================
   DELETE PAYMENT PROOF (GRIDFS)
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

/* REMOVE FILE FROM GRIDFS */

if(invoice.proofImage && gridfsBucket){

try {
    const file = await gridfsBucket.find({ filename: invoice.proofImage }).toArray();
    if (file && file.length > 0) {
        await gridfsBucket.delete(file[0]._id);
        console.log("Deleted file from GridFS:", invoice.proofImage);
    }
} catch (err) {
    console.log("File not found in GridFS, may already be deleted");
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
{ status:"Paid", datePaid: new Date() }
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
   DELETE INVOICE (GRIDFS)
========================= */

router.delete("/delete-invoice/:id", authenticate, async (req,res)=>{

try{

const invoice =
await Invoice.findById(req.params.id);

if(invoice && invoice.proofImage && gridfsBucket){

try {
    const file = await gridfsBucket.find({ filename: invoice.proofImage }).toArray();
    if (file && file.length > 0) {
        await gridfsBucket.delete(file[0]._id);
    }
} catch (err) {
    console.log("File not found in GridFS");
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

// Export the router and the setGridFSBucket function
module.exports = router;
module.exports.setGridFSBucket = setGridFSBucket;