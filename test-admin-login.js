const mongoose = require('mongoose');
const Admin = require('./backend/models/Admin');

const atlasConnectionString = "mongodb+srv://regals_admin:huhusystem@regals-cluster.cp2wtzr.mongodb.net/regals-monitoring?appName=regals-cluster";

async function testAdminLogin() {
    try {
        console.log('🔍 Testing admin account creation and login...');
        
        // Connect to Atlas
        await mongoose.connect(atlasConnectionString);
        console.log('✅ Connected to Atlas');
        
        // Check if admin exists
        const admin = await Admin.findOne({ email: 'regalsapartment@gmail.com' });
        
        if (!admin) {
            console.log('❌ Admin account not found');
            return;
        }
        
        console.log('✅ Admin account found:');
        console.log(`📧 Email: ${admin.email}`);
        console.log(`👤 Name: ${admin.full_name}`);
        console.log(`🔐 Role: ${admin.role}`);
        
        // Test password matching
        const isMatch = await admin.matchPassword('admin2026');
        
        if (isMatch) {
            console.log('✅ Password verification successful!');
            console.log('🎉 Admin login credentials are working correctly');
        } else {
            console.log('❌ Password verification failed');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testAdminLogin();
