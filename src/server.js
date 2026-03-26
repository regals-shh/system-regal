const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const dotenv = require("dotenv");
const Grid = require("gridfs-stream");

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// MODELS
const Tenant = require("./models/Tenant");
const Invoice = require("./models/Invoice");

// ROUTES
const tenantRoutes = require("./routes/tenantRoutes");
const billingRoutes = require("./routes/billing");
const announcementRoutes = require("./routes/announcementRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const serviceRoutes = require("./routes/serviceRoutes")
const messageRoutes = require("./routes/messages");
const roomRoutes = require("./routes/rooms");
const reportsRouter = require("./routes/reports");
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const visitorRoutes = require('./routes/visitorRoutes');

const app = express();

// MIDDLEWARE
// CORS Configuration - Allow all origins for mobile app compatibility
app.use(cors({
    origin: true,  // Allow all origins including Android app (null origin)
    credentials: true
}));
app.use(express.json());

// SERVE FRONTEND FILES
app.use(express.static(path.join(__dirname, "..")));

// GridFS setup
let gfs;
let gridfsBucket;

/* =========================
   MULTER FILE UPLOAD SETUP (MEMORY -> GRIDFS)
========================= */

const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/* =========================
   API ROUTES
========================= */

app.use("/api", tenantRoutes);
app.use("/api", billingRoutes);
app.use("/api",announcementRoutes);
app.use("/api", maintenanceRoutes);
app.use("/api", serviceRoutes);
app.use("/api", messageRoutes);
app.use("/api", roomRoutes);
app.use("/api/reports", reportsRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', visitorRoutes);

/* =========================
   GRIDFS IMAGE RETRIEVAL
========================= */

app.get("/api/proof-image/:filename", async (req, res) => {
    try {
        if (!gridfsBucket) {
            return res.status(500).json({ message: "GridFS not initialized" });
        }
        
        const file = await gridfsBucket.find({ filename: req.params.filename }).toArray();
        
        if (!file || file.length === 0) {
            return res.status(404).json({ message: "Image not found" });
        }
        
        const readStream = gridfsBucket.openDownloadStreamByName(req.params.filename);
        res.set('Content-Type', file[0].contentType || 'image/jpeg');
        readStream.pipe(res);
    } catch (error) {
        console.error("Error retrieving image:", error);
        res.status(500).json({ message: "Error retrieving image" });
    }
});

/* =========================
   UPLOAD PAYMENT PROOF (GRIDFS)
========================= */

app.post("/api/upload-payment/:id", upload.single("proof"), async (req,res)=>{

try{

if(!req.file){
return res.status(400).json({message:"No file uploaded"});
}

const invoice = await Invoice.findById(req.params.id);

if(!invoice){
return res.status(404).json({message:"Invoice not found"});
}

// Delete old proof from GridFS if exists
if(invoice.proofImage && gridfsBucket) {
    try {
        const oldFile = await gridfsBucket.find({ filename: invoice.proofImage }).toArray();
        if (oldFile && oldFile.length > 0) {
            await gridfsBucket.delete(oldFile[0]._id);
        }
    } catch (err) {
        console.log("Old file not found or already deleted");
    }
}

// Save new file to GridFS
const uniqueName = Date.now() + path.extname(req.file.originalname);
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

console.log("Uploaded file to GridFS:", uniqueName);

res.json({
message:"Payment proof uploaded successfully",
file:uniqueName
});

}catch(error){

console.error("Upload error:",error);
res.status(500).json({message:"Server error"});

}

});

/* =========================
   DELETE PAYMENT PROOF (GRIDFS)
========================= */

app.delete("/api/delete-proof/:id", async (req,res)=>{

try{

const invoice = await Invoice.findById(req.params.id);

if(!invoice){
return res.status(404).json({message:"Invoice not found"});
}

if(!invoice.proofImage){
return res.status(400).json({message:"No proof image to delete"});
}

// Delete the file from GridFS
if (gridfsBucket) {
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

// Remove proof from invoice
invoice.proofImage = null;
invoice.status = "Unpaid";

await invoice.save();

res.json({message:"Proof deleted successfully"});

}catch(error){

console.error("Delete error:",error);
res.status(500).json({message:"Server error"});

}

});

/* =========================
   DATABASE CONNECTION
========================= */

// Ensure MONGODB_URI is set
if (!process.env.MONGODB_URI) {
    console.error("ERROR: MONGODB_URI environment variable is not set");
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("✅ Database Connected");
    
    // Initialize GridFS
    const db = mongoose.connection.db;
    gridfsBucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: 'proofImages'
    });
    gfs = Grid(db, mongoose.mongo);
    gfs.collection('proofImages');
    console.log("✅ GridFS Initialized");
    
    // Pass gridfsBucket to billing routes
    billingRoutes.setGridFSBucket(gridfsBucket);
})
.catch(err => {
    console.error("❌ Database Error:", err);
    process.exit(1);
});

/* =========================
   HEALTH CHECK & TEST ROUTES
========================= */

// Health check for Render
app.get("/health", (req, res) => {
    res.json({ 
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "Regals Monitoring API"
    });
});

// Root route
app.get("/", (req, res) => {
    res.json({
        message: "Regals Monitoring Backend Running",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

/* =========================
   VISITOR TEST ROUTE
========================= */

app.get("/api/test-visitor", (req, res) => {
    res.json({ 
        message: "Visitor routes are working!",
        timestamp: new Date().toISOString()
    });
});

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
    res.status(404).json({ 
        message: "Route not found",
        path: req.path
    });
});

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
    console.error("Server Error:", err);
    res.status(500).json({ 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`✅ Server running on http://${HOST}:${PORT}`);
    console.log(`📅 ${new Date().toISOString()}`);
});