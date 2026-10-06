const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/user');
const Event = require('../models/event');

dotenv.config();

const adminEmail = process.env.ADMIN_EMAIL || process.argv[2];

const migrateEvents = async () => {
    if (!adminEmail) {
        throw new Error('Provide an admin email with ADMIN_EMAIL or: node scripts/migrateEvents.js admin@example.com');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await User.findOne({ email: adminEmail, role: 'admin' });
    if (!admin) throw new Error(`No admin user found for ${adminEmail}`);

    const result = await Event.updateMany(
        { $or: [{ status: { $exists: false } }, { createdBy: { $exists: false } }] },
        {
            $set: {
                status: 'approved',
                createdBy: admin._id,
                reviewedBy: null,
                reviewedAt: null,
                rejectionReason: null,
            },
        }
    );
    console.log(`Migrated ${result.modifiedCount} legacy event(s).`);
};

migrateEvents()
    .catch((error) => {
        console.error('Event migration failed:', error.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.connection.close());
