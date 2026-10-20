const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
const axios = require('axios');
dotenv.config()
const app = express()
const mongoose = require('mongoose')
const authRoutes = require('./routes/auth')
const eventRoutes = require('./routes/event')
const bookingRoutes = require('./routes/booking')
const adminEventRoutes = require('./routes/adminEvent')
const subscriptionRoutes = require('./routes/subscription')
const { notFound, errorHandler } = require('./middlewares/errorHandler')
const mongoSanitize = require('@exortek/express-mongo-sanitize')

app.use(cors())
app.use(express.json())
app.use(mongoSanitize())


const url = `https://gatherly-frontend-sk1t.onrender.com/`
const interval = 780000

function reloadWebsite() {
  axios
    .get(url)
    .then((response) => {
      console.log("website reloded")
    })
    .catch((error) => {
      console.error(`Error : ${error.message}`)
    })
}

setInterval(reloadWebsite, interval)

app.get('/uploads/events/default-event.jpg', (req, res) => {
    res.type('image/svg+xml').send('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="#0D47A1"/><circle cx="555" cy="335" r="82" fill="#2196F3"/><circle cx="645" cy="335" r="82" fill="#90CAF9"/><text x="600" y="535" text-anchor="middle" fill="#E3F2FD" font-family="Arial,sans-serif" font-size="48" font-weight="700">Gatherly</text></svg>');
})
app.use('/uploads/events', express.static(path.join(__dirname, 'uploads', 'events')))

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
})

//Routes
app.use('/api/auth', authRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/event', eventRoutes) 
app.use('/api/bookings', bookingRoutes)
app.use('/api/booking', bookingRoutes) 
app.use('/api/admin', adminEventRoutes)
app.use('/api/subscriptions', subscriptionRoutes)

app.use(notFound)
app.use(errorHandler)

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gatherly';

console.log('ENV CHECK:', {
    PORT: process.env.PORT,
    hasMongoUri: !!process.env.MONGODB_URI,
    hasMongoUriAlt: !!process.env.MONGO_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV
});

mongoose.connect(mongoUri)
.then(() => {
    console.log('Connected to Mongo Db')
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`)
    });
}).catch((err) => {
    console.error('Unable to connect to MongoDB. The API was not started:', err.message)
    process.exitCode = 1
})