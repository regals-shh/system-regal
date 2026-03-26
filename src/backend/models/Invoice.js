const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({

tenantId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Tenant",
required:false
},

tenantName:{
type:String,
required:true
},

roomNumber:{
type:String,
required:true
},

amount:{
type:Number,
required:true
},

description:{
type:String
},

dueDate:{
type:Date,
required:true
},

status:{
type:String,
enum:["Pending","Paid","Overdue","Unpaid"],
default:"Pending"
},

proofImage:{
type:String,
default:""
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("Invoice",invoiceSchema);