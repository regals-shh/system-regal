const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema({

tenantId:{
type: mongoose.Schema.Types.ObjectId,
ref:"Tenant"
},

tenantName:String,
roomNumber:String,

category:String,

description:String,

status:{
type:String,
default:"Pending"
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("Maintenance",maintenanceSchema);