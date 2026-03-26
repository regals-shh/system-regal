const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({

    title:{
        type:String,
        required:true
    },

    message:{
        type:String,
        required:true
    },

    priority:{
        type:String,
        enum:["normal","important","urgent"],
        default:"normal"
    },

    seenBy:[
        {
            tenantId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Tenant"
            },

            name:String,

            seenAt:{
                type:Date,
                default:Date.now
            }
        }
    ],

    createdAt:{
        type:Date,
        default:Date.now
    }

});

module.exports = mongoose.model("Announcement",announcementSchema);