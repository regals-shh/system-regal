const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    full_name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' }
});

// Pre-save: hash password if new or modified
adminSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
adminSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model('Admin', adminSchema);