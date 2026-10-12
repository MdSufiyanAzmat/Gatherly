const Booking = require('../models/booking');
const Event = require('../models/event');
const { sendBookingRejectedEmail, sendNotification } = require('./emailService');

const STALE_BOOKING_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Cancels paid bookings whose 24-hour payment hold expired and restores each held seat once.
 * Compare-and-set updates make repeated jobs and concurrent workers idempotent.
 */
const cancelStalePendingBookings = async () => {
    const cutoff = new Date(Date.now() - STALE_BOOKING_AGE_MS);
    const candidates = await Booking.find({
        status: 'pending',
        isFreeEvent: false,
        createdAt: { $lt: cutoff },
    }).populate('userId', 'name email').populate('eventId', 'title');

    let cancelled = 0;
    for (const candidate of candidates) {
        const booking = await Booking.findOneAndUpdate(
            { _id: candidate._id, status: 'pending' },
            { $set: { status: 'cancelled' } },
            { new: true }
        );
        if (!booking) continue;

        await Event.findByIdAndUpdate(booking.eventId, { $inc: { availableSeats: 1 } });
        cancelled += 1;

        void sendNotification('expired booking email', () => sendBookingRejectedEmail(
            candidate.userId?.email,
            candidate.userId?.name,
            candidate.eventId?.title || 'your event',
            'Your payment hold expired because no payment proof was submitted within 24 hours.',
            { isAutoCancelled: true }
        ));
    }

    return { cancelled, cutoff };
};

module.exports = { STALE_BOOKING_AGE_MS, cancelStalePendingBookings };
