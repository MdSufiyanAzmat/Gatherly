const mongoose = require('mongoose');

const paymentScreenshotSchema = new mongoose.Schema({
    url: { type: String, default: '' },
    filename: { type: String, default: '' },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'event', required: true },
    // Denormalized organizer ID: owner dashboards never need an event join to authorize/query.
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentScreenshot: { type: paymentScreenshotSchema, default: () => ({}) },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected', 'cancelled'],
        default: 'pending',
        index: true,
    },
    paymentStatus: {
        type: String,
        enum: ['not_paid', 'paid'],
        default: 'not_paid',
    },
    amount: { type: Number, required: true, min: 0 },
    ownerNote: { type: String, default: null, trim: true },
    reviewedAt: { type: Date, default: null },
    isFreeEvent: { type: Boolean, default: false },
}, { timestamps: true });

// A buyer can have only one lifecycle record for one event; cancelling does not permit a second booking.
bookingSchema.index({ eventId: 1, userId: 1 }, { unique: true });
bookingSchema.index({ ownerId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('booking', bookingSchema);
