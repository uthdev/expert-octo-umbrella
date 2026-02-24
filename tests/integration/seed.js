const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');

// Import models
const User = require('../../managers/entities/user/User.model');

async function seedTestUsers() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/school-management-api';
        await mongoose.connect(mongoUri);
        console.log('📦 Connected to MongoDB for seeding');

        // Clear existing test users
        await User.deleteMany({ email: { $in: ['admin@school.com', 'school@demo.com'] } });
        console.log('🗑️  Cleared existing test users');

        // Create superadmin
        const superadmin = new User({
            email: 'admin@school.com',
            password: await bcrypt.hash('admin123', 10),
            role: 'superadmin',
            firstName: 'Super',
            lastName: 'Admin',
            schoolId: null,
            userKey: nanoid(),
            status: 'active'
        });
        await superadmin.save();
        console.log('✅ Created superadmin: admin@school.com');

        // Create school admin (without schoolId for now)
        const schoolAdmin = new User({
            email: 'school@demo.com',
            password: await bcrypt.hash('school123', 10),
            role: 'school_admin',
            firstName: 'School',
            lastName: 'Admin',
            schoolId: null,
            userKey: nanoid(),
            status: 'active'
        });
        await schoolAdmin.save();
        console.log('✅ Created school admin: school@demo.com');

        console.log('🎉 Database seeded successfully!');
        
        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        throw error;
    }
}

module.exports = seedTestUsers;

// Run if called directly
if (require.main === module) {
    seedTestUsers()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
