const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
dotenv.config()
const app = express()
const mongoose = require('mongoose')
const authRoutes = require('./routes/auth')
const eventRoutes = require('./routes/event')
const bookingRoutes = require('./routes/booking')
const adminEventRoutes = require('./routes/adminEvent')
const subscriptionRoutes = require('./routes/subscription')
const { notFound, errorHandler } = require('./middlewares/errorHandler')

app.use(cors())
app.use(express.json())
// Event images are public. Payment proofs deliberately have no static route.
app.get('/uploads/events/default-event.jpg', (req, res) => {
    // Keep the model's stable JPG-looking URL while serving a lightweight branded fallback.
    res.type('image/svg+xml').send('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="#0D47A1"/><circle cx="555" cy="335" r="82" fill="#2196F3"/><circle cx="645" cy="335" r="82" fill="#90CAF9"/><text x="600" y="535" text-anchor="middle" fill="#E3F2FD" font-family="Arial,sans-serif" font-size="48" font-weight="700">Gatherly</text></svg>');
})
app.use('/uploads/events', express.static(path.join(__dirname, 'uploads', 'events')))

//Routes
app.use('/api/auth', authRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/event', eventRoutes) // Backward compatibility for existing clients
app.use('/api/bookings', bookingRoutes)
app.use('/api/booking', bookingRoutes) // Backward compatibility for existing clients
app.use('/api/admin', adminEventRoutes)
app.use('/api/subscriptions', subscriptionRoutes)

app.use(notFound)
app.use(errorHandler)

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gatherly';

mongoose.connect(mongoUri)
.then(async ()=>{
    console.log('Connected to Mongo Db')
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    });

    // Redis is optional. Enable this only in environments that run Redis.
    if (process.env.ENABLE_BOOKING_CLEANUP === 'true') {
        const { ensureStaleBookingCleanupSchedule, startBookingCleanupWorker } = require('./queues/bookingCleanupQueue');
        try {
            await ensureStaleBookingCleanupSchedule();
            startBookingCleanupWorker();
        } catch (error) {
            console.error('Unable to start stale booking cleanup scheduler:', error.message);
        }
    }
}).catch((err) => {
    console.error('Unable to connect to MongoDB. The API was not started:', err.message)
    process.exitCode = 1
})
