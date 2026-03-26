const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const dotenv = require("dotenv");

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

// SERVE UPLOADED FILES
app.use("/uploads", express.static("uploads"));

/* =========================
   MULTER FILE UPLOAD SETUP
========================= */

const storage = multer.diskStorage({

destination: function(req,file,cb){
cb(null, path.join(__dirname,"uploads"));
},

filename: function(req, file, cb){
const uniqueName = Date.now() + path.extname(file.originalname);
cb(null, uniqueName);
}

});

const upload = multer({ storage: storage });

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
   UPLOAD PAYMENT PROOF
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

invoice.proofImage = req.file.filename;
invoice.status = "Pending";

await invoice.save();

console.log("Uploaded file:", req.file.filename);

res.json({
message:"Payment proof uploaded successfully",
file:req.file.filename
});

}catch(error){

console.error("Upload error:",error);
res.status(500).json({message:"Server error"});

}

});

/* =========================
   DELETE PAYMENT PROOF
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

// Delete the file from filesystem
const fs = require('fs');
const filePath = path.join(__dirname, 'uploads', invoice.proofImage);

if(fs.existsSync(filePath)){
fs.unlinkSync(filePath);
console.log("Deleted file:", invoice.proofImage);
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