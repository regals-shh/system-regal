const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({

roomNumber:{
type:String,
required:true,
unique:true
},

type:{
type:mongoose.Schema.Types.ObjectId,
ref:"RoomType",
required:true
},

status:{
type:String,
enum:["Available","Occupied"],
default:"Available"
}

});

module.exports = mongoose.model("Room", RoomSchema);