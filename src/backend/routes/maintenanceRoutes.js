const express = require("express");
const router = express.Router();

const Maintenance = require("../models/Maintenance");
const Tenant = require("../models/Tenant");


// ===============================
// TENANT CREATE REQUEST
// ===============================

router.post("/create-request", async (req,res)=>{

try{

const {tenantId, category, description} = req.body;

const tenant = await Tenant.findById(tenantId);

const request = new Maintenance({

tenantId:tenant._id,
tenantName:tenant.name,
roomNumber:tenant.roomNumber,

category,
description

});

await request.save();

res.json({message:"Request sent successfully"});

}catch(error){

res.status(500).json({message:"Server error"});

}

});


// ===============================
// TENANT GET THEIR REQUESTS
// ===============================

router.get("/tenant-requests/:tenantId", async (req,res)=>{

try{

const requests = await Maintenance.find({
tenantId:req.params.tenantId
});

res.json(requests);

}catch(error){

res.status(500).json({message:"Server error"});

}

});


// ===============================
// TENANT UPDATE REQUEST
// ===============================

router.put("/update-request/:id", async (req,res)=>{

try{

const {category, description} = req.body;

await Maintenance.findByIdAndUpdate(req.params.id,{
category,
description
});

res.json({message:"Request updated"});

}catch(error){

res.status(500).json({message:"Server error"});

}

});


// ===============================
// TENANT DELETE REQUEST
// ===============================

router.delete("/delete-request/:id", async (req,res)=>{

try{

await Maintenance.findByIdAndDelete(req.params.id);

res.json({message:"Request deleted"});

}catch(error){

res.status(500).json({message:"Server error"});

}

});


// ===============================
// ADMIN GET ALL REQUESTS
// ===============================

router.get("/all-requests", async (req,res)=>{

try{

const requests = await Maintenance.find().sort({createdAt:-1});

res.json(requests);

}catch(error){

res.status(500).json({message:"Server error"});

}

});


// ===============================
// ADMIN UPDATE STATUS
// ===============================

router.put("/update-request-status/:id", async (req,res)=>{

try{

const {status} = req.body;

await Maintenance.findByIdAndUpdate(req.params.id,{
status
});

res.json({message:"Status updated"});

}catch(error){

res.status(500).json({message:"Server error"});

}

});

// ===============================
// UPDATE REQUEST
// ===============================

router.put("/update-request/:id", async (req,res)=>{

try{

const {category, description} = req.body;

await Request.findByIdAndUpdate(req.params.id,{
category,
description
});

res.json({
message:"Request updated successfully"
});

}catch(error){

res.status(500).json({
message:"Server error"
});

}

});

//admin delete para sa admin//

router.delete("/delete-request/:id", async (req,res)=>{
    try{

        await Request.findByIdAndDelete(req.params.id);

        res.json({message:"Request deleted successfully"});

    }catch(err){
        res.status(500).json({error:"Failed to delete request"});
    }
});


module.exports = router;