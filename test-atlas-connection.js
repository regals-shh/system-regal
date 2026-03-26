const mongoose = require('mongoose');

// Your actual Atlas connection string
const atlasConnectionString = "mongodb+srv://regals_admin:huhusystem@regals-cluster.cp2wtzr.mongodb.net/?appName=regals-cluster";

async function testAtlasConnection() {
    try {
        console.log('🔍 Testing MongoDB Atlas connection...');
        console.log('📡 Connecting to Atlas...');
        
        await mongoose.connect(atlasConnectionString);
        
        console.log('✅ SUCCESS! Connected to MongoDB Atlas!');
        console.log('🎉 Your Atlas database is ready for deployment');
        
        // Test database operations
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log(`📊 Found ${collections.length} collections in database`);
        
    } catch (error) {
        console.error('❌ FAILED to connect to Atlas:');
        console.error('Error details:', error.message);
        
        if (error.message.includes('Authentication failed')) {
            console.log('💡 Check your username and password');
        } else if (error.message.includes('ENOTFOUND')) {
            console.log('💡 Check your cluster name and network access');
        }
    } finally {
        await mongoose.disconnect();
    }
}

testAtlasConnection();
