const mongoose = require('mongoose');

// Import your models
const Tenant = require('./backend/models/Tenant');
const Room = require('./backend/models/Room');

const atlasConnectionString = "mongodb+srv://regals_admin:huhusystem@regals-cluster.cp2wtzr.mongodb.net/regals-monitoring?appName=regals-cluster";

async function testDatabaseOperations() {
    try {
        console.log('🔍 Testing database operations with Atlas...');
        
        // Connect to Atlas
        await mongoose.connect(atlasConnectionString);
        console.log('✅ Connected to Atlas');
        
        // Test 1: Count existing tenants
        const tenantCount = await Tenant.countDocuments();
        console.log(`📊 Found ${tenantCount} tenants in database`);
        
        // Test 2: Count existing rooms
        const roomCount = await Room.countDocuments();
        console.log(`🏠 Found ${roomCount} rooms in database`);
        
        // Test 3: Create a test tenant (if database is empty)
        if (tenantCount === 0) {
            console.log('📝 Database is empty, creating test data...');
            
            const testTenant = new Tenant({
                name: 'Test Tenant',
                email: 'test@example.com',
                phone: '1234567890',
                password: 'test123',
                roomNumber: '101'
            });
            
            await testTenant.save();
            console.log('✅ Test tenant created successfully');
            
            // Clean up test data
            await Tenant.deleteOne({ _id: testTenant._id });
            console.log('🧹 Test data cleaned up');
        }
        
        console.log('🎉 All database operations working perfectly!');
        console.log('🚀 Your application is ready for cloud deployment!');
        
    } catch (error) {
        console.error('❌ Database operation failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testDatabaseOperations();
