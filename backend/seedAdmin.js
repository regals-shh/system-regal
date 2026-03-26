const mongoose = require('mongoose');
const Admin = require('./models/Admin');

mongoose.connect('mongodb+srv://regals_admin:huhusystem@regals-cluster.cp2wtzr.mongodb.net/regals-monitoring?appName=regals-cluster')
    .then(() => console.log('Database connected'))
    .catch(err => console.log(err));

async function seed() {
    const exists = await Admin.findOne({ email: 'regalsapartment@gmail.com' });
    if (exists) {
        console.log('Admin already exists');
        mongoose.disconnect();
        return;
    }

    const admin = new Admin({
        email: 'regalsapartment@gmail.com',
        full_name: 'System Administrator',
        password: 'admin2026'
    });

    await admin.save();
    console.log('Admin created!');
    mongoose.disconnect();
}

seed();