const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const email = 'superadmin@admin.com';
        
        let adminUser = await User.findOne({ email });
        
        if (adminUser) {
            adminUser.name = 'superadmin';
            adminUser.password = '0987';
            adminUser.role = 'super_admin';
            await adminUser.save();
            console.log('Existing super admin updated!');
        } else {
            adminUser = await User.create({
                name: 'superadmin',
                email: email,
                password: '0987',
                role: 'super_admin'
            });
            console.log('New super admin created!');
        }
        
        console.log('Super Admin Account Created Successfully.');
        console.log('Email to login:', email);
        console.log('Password to login:', '0987');
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seed();
