require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/user');
const Event = require('./models/event');
const Booking = require('./models/booking');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gatherly';

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // ── Clear existing data ──────────────────────────────
        await Promise.all([
            User.deleteMany({}),
            Event.deleteMany({}),
            Booking.deleteMany({}),
        ]);
        console.log('🧹 Cleared existing users, events, and bookings');

        // ── Users ────────────────────────────────────────────
        const passwordHash = await bcrypt.hash('password123', 10);

        const users = await User.insertMany([
            {
                name: 'Admin User',
                email: 'admin@gatherly.com',
                password: passwordHash,
                role: 'admin',
                isVerified: true,
            },
            {
                name: 'Aarav Sharma',
                email: 'aarav@gatherly.com',
                password: passwordHash,
                role: 'user',
                isVerified: true,
            },
            {
                name: 'Priya Verma',
                email: 'priya@gatherly.com',
                password: passwordHash,
                role: 'user',
                isVerified: true,
            },
            {
                name: 'Rohan Mehta',
                email: 'rohan@gatherly.com',
                password: passwordHash,
                role: 'user',
                isVerified: false,
            },
        ]);

        const [admin, aarav, priya, rohan] = users;
        console.log(`👥 Seeded ${users.length} users`);

        // ── Events ───────────────────────────────────────────
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;

        const events = await Event.insertMany([
            {
                title: 'Tech Meetup 2026',
                description:
                    'A gathering of developers, designers, and founders sharing the latest in web and AI.',
                date: new Date(now + 7 * day),
                location: 'Bengaluru Convention Center',
                category: 'Technology',
                totalSeats: 200,
                availableSeats: 200,
                ticketPrice: 0,
                createdBy: aarav._id,
                status: 'approved',
                reviewedBy: admin._id,
                reviewedAt: new Date(),
            },
            {
                title: 'Sunset Music Festival',
                description:
                    'An evening of live indie music, food trucks, and good vibes by the lake.',
                date: new Date(now + 14 * day),
                location: 'Powai Lake Grounds, Mumbai',
                category: 'Music',
                totalSeats: 500,
                availableSeats: 480,
                ticketPrice: 799,
                paymentInfo: {
                    phoneNumber: 'aarav@upi',
                    notes: 'Pay via UPI and upload your screenshot after booking.',
                },
                createdBy: aarav._id,
                status: 'approved',
                reviewedBy: admin._id,
                reviewedAt: new Date(),
            },
            {
                title: 'Startup Pitch Night',
                description:
                    'Early-stage founders pitch to a panel of investors and mentors.',
                date: new Date(now + 21 * day),
                location: 'WeWork Galaxy, Bengaluru',
                category: 'Business',
                totalSeats: 100,
                availableSeats: 95,
                ticketPrice: 499,
                paymentInfo: {
                    phoneNumber: 'priya@upi',
                    notes: 'Scan the QR code on the event page to pay.',
                },
                createdBy: priya._id,
                status: 'approved',
                reviewedBy: admin._id,
                reviewedAt: new Date(),
            },
            {
                title: 'Yoga & Wellness Retreat',
                description:
                    'A half-day retreat with guided yoga, meditation, and a healthy brunch.',
                date: new Date(now + 30 * day),
                location: 'Rishikesh Riverside Resort',
                category: 'Wellness',
                totalSeats: 50,
                availableSeats: 50,
                ticketPrice: 1200,
                paymentInfo: {
                    phoneNumber: 'priya@upi',
                },
                createdBy: priya._id,
                status: 'pending',
            },
            {
                title: 'Photography Walk',
                description:
                    'Explore the old city with your camera. All skill levels welcome.',
                date: new Date(now + 10 * day),
                location: 'Chandni Chowk, Delhi',
                category: 'Art',
                totalSeats: 30,
                availableSeats: 30,
                ticketPrice: 0,
                createdBy: rohan._id,
                status: 'pending',
            },
        ]);

        const [techMeetup, musicFest, pitchNight, yogaRetreat, photoWalk] = events;
        console.log(`📅 Seeded ${events.length} events`);

        // ── Bookings ─────────────────────────────────────────
        // Free event → auto-confirmed
        const bookings = await Booking.insertMany([
            {
                userId: priya._id,
                eventId: techMeetup._id,
                ownerId: techMeetup.createdBy,
                amount: 0,
                status: 'confirmed',
                paymentStatus: 'not_paid',
                isFreeEvent: true,
            },
            {
                userId: rohan._id,
                eventId: techMeetup._id,
                ownerId: techMeetup.createdBy,
                amount: 0,
                status: 'confirmed',
                paymentStatus: 'not_paid',
                isFreeEvent: true,
            },
            // Paid event → pending screenshot review
            {
                userId: rohan._id,
                eventId: musicFest._id,
                ownerId: musicFest.createdBy,
                amount: 799,
                status: 'pending',
                paymentStatus: 'paid',
                paymentScreenshot: {
                    url: '/uploads/bookings/sample-screenshot.jpg',
                    filename: 'sample-screenshot.jpg',
                },
                isFreeEvent: false,
            },
            {
                userId: aarav._id,
                eventId: pitchNight._id,
                ownerId: pitchNight.createdBy,
                amount: 499,
                status: 'confirmed',
                paymentStatus: 'paid',
                paymentScreenshot: {
                    url: '/uploads/bookings/sample-screenshot-2.jpg',
                    filename: 'sample-screenshot-2.jpg',
                },
                reviewedAt: new Date(),
                ownerNote: 'Payment verified. See you there!',
                isFreeEvent: false,
            },
            {
                userId: rohan._id,
                eventId: yogaRetreat._id,
                ownerId: yogaRetreat.createdBy,
                amount: 1200,
                status: 'rejected',
                paymentStatus: 'not_paid',
                ownerNote: 'Screenshot was unclear. Please rebook and re-upload.',
                reviewedAt: new Date(),
                isFreeEvent: false,
            },
        ]);

        // Keep event.availableSeats consistent for confirmed bookings
        const confirmedCounts = {};
        for (const b of bookings) {
            if (b.status === 'confirmed') {
                const key = String(b.eventId);
                confirmedCounts[key] = (confirmedCounts[key] || 0) + 1;
            }
        }

        for (const [eventId, count] of Object.entries(confirmedCounts)) {
            await Event.findByIdAndUpdate(
                eventId,
                { $inc: { availableSeats: -count } },
                { returnDocument: 'after' }
            );
        }

        console.log(`🎟️  Seeded ${bookings.length} bookings`);

        // ── Summary ─────────────────────────────────────────
        console.log('\n────────────── SEED SUMMARY ──────────────');
        console.log('Login credentials (password for all): password123');
        console.log('  Admin : admin@gatherly.com');
        console.log('  User  : aarav@gatherly.com');
        console.log('  User  : priya@gatherly.com');
        console.log('  User  : rohan@gatherly.com  (unverified)');
        console.log('──────────────────────────────────────────\n');

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err);
        await mongoose.disconnect();
        process.exit(1);
    }
};

seed();
