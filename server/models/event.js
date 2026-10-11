const mongoose = require('mongoose');

const DEFAULT_EVENT_IMAGE = '/uploads/events/default-event.jpg';

const fileSchema = new mongoose.Schema({
    url: { type: String, default: '' },
    filename: { type: String, default: '' },
}, { _id: false });

const paymentInfoSchema = new mongoose.Schema({
    // The organizer's UPI ID or phone number. Gatherly never receives the payment.
    phoneNumber: { type: String, default: null, trim: true },
    qrCode: { type: fileSchema, default: () => ({}) },
    notes: { type: String, default: null, trim: true },
}, { _id: false });

const commentSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: { createdAt: true, updatedAt: false } });

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    totalSeats: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, required: true, min: 0 },
    ticketPrice: { type: Number, required: true, min: 0 },
    image: {
        type: fileSchema,
        default: () => ({ url: DEFAULT_EVENT_IMAGE, filename: 'default-event.jpg' }),
    },
    paymentInfo: { type: paymentInfoSchema, default: () => ({}) },
    registrationLink: { type: String, default: null, trim: true },
    // The organizer. Both users and admins may own events.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Used only for deduplication/audit of free in-app registrations.
    registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: { type: [commentSchema], default: [] },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
}, { timestamps: true });

/** True when this event requires an organizer-direct payment. */
eventSchema.virtual('isPaid').get(function isPaid() {
    return this.ticketPrice > 0;
});

eventSchema.virtual('likeCount').get(function likeCount() {
    return this.likes?.length || 0;
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

eventSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('event', eventSchema);
module.exports.DEFAULT_EVENT_IMAGE = DEFAULT_EVENT_IMAGE;
