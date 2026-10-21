const fs = require('fs');
const path = require('path');
const Booking = require('../models/booking');
const Event = require('../models/event');
const { getPagination, paginationMetadata } = require('../utils/pagination');
const {
    sendBookingConfirmedEmail,
    sendBookingRejectedEmail,
    sendOwnerBookingNotification,
    sendProofSubmittedNotification,
    sendNotification,
} = require('../services/emailService');

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const sameId = (left, right) => left?.toString() === right?.toString();
const isEventFinished = (event) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(event.date).getTime() < today.getTime();
};
const eventPopulate = { path: 'eventId', select: 'title date ticketPrice image' };
const userPopulate = { path: 'userId', select: 'name email' };

const sendBookingConfirmed = (booking) => {
    void sendNotification('booking confirmation email', () => sendBookingConfirmedEmail(
        booking.userId?.email,
        booking.userId?.name,
        booking.eventId?.title,
        booking.amount,
    ));
};

//creating booking
exports.createFreeBooking = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId).populate('createdBy', 'name email');
        if (!event || event.status !== 'approved') throw httpError(404, 'Event not found');
        if (event.registrationLink) throw httpError(400, 'This event uses the organizer registration link.');
        if (isEventFinished(event)) throw httpError(400, 'This event has finished. Registration is closed.');
        if (event.isPaid) throw httpError(400, 'This is a paid event.');
        if (event.availableSeats <= 0) throw httpError(400, 'Sold out.');

        const existingBooking = await Booking.exists({ userId: req.user._id, eventId: event._id });
        if (existingBooking) throw httpError(409, 'You have already registered for this event.');

        const reservedEvent = await Event.findOneAndUpdate(
            { _id: event._id, status: 'approved', availableSeats: { $gt: 0 } },
            { $inc: { availableSeats: -1 }, $addToSet: { registrations: req.user._id } },
            { new: true }
        );
        if (!reservedEvent) throw httpError(400, 'Sold out.');

        let booking;
        try {
            booking = await Booking.create({
                userId: req.user._id,
                eventId: event._id,
                ownerId: event.createdBy._id,
                amount: 0,
                isFreeEvent: true,
                status: 'confirmed',
                paymentStatus: 'paid',
            });
        } catch (error) {
            await Event.findByIdAndUpdate(event._id, {
                $inc: { availableSeats: 1 },
                $pull: { registrations: req.user._id },
            });
            if (error.code === 11000) throw httpError(409, 'You have already registered for this event.');
            throw error;
        }

        res.status(201).json({ success: true, data: booking, message: 'Registered!' });

        void sendNotification('booking confirmation email', () => sendBookingConfirmedEmail(req.user.email, req.user.name, event.title, 0));
        void sendNotification('new booking notification', () => sendOwnerBookingNotification({
            to: event.createdBy.email, ownerName: event.createdBy.name, buyerName: req.user.name,
            buyerEmail: req.user.email, eventTitle: event.title, amount: 0,
        }));
    } catch (error) {
        next(error);
    }
};

exports.initiatePaidBooking = async (req, res, next) => {
    try {
        const eventId = req.params.eventId;
        const candidate = await Event.findById(eventId);
        if (!candidate || candidate.status !== 'approved') throw httpError(404, 'Event not available.');
        if (isEventFinished(candidate)) throw httpError(400, 'This event has finished. Registration is closed.');
        if (!candidate.isPaid) throw httpError(400, 'This is a free event.');
        if (!candidate.paymentInfo?.phoneNumber && !candidate.paymentInfo?.qrCode?.url) {
            throw httpError(400, 'The organizer has not configured payment details for this event.');
        }

        const existingBooking = await Booking.findOne({ userId: req.user._id, eventId });
        if (existingBooking) {
            if (existingBooking.status === 'pending' && existingBooking.paymentStatus === 'not_paid') {
                return res.json({
                    success: true,
                    data: { booking: existingBooking, paymentInfo: candidate.paymentInfo },
                    message: 'Your payment hold is still active. You can resume payment.',
                });
            }
            if (existingBooking.status === 'pending') {
                throw httpError(409, 'Your payment proof is already submitted and awaiting organizer review.');
            }
            throw httpError(409, 'You already have a booking for this event.');
        }

        const event = await Event.findOneAndUpdate(
            { _id: eventId, status: 'approved', availableSeats: { $gt: 0 } },
            { $inc: { availableSeats: -1 } },
            { new: true }
        );
        if (!event) throw httpError(400, 'Sold out or event not available.');

        try {
            const booking = await Booking.create({
                userId: req.user._id,
                eventId: event._id,
                ownerId: event.createdBy,
                amount: event.ticketPrice,
                status: 'pending',
                paymentStatus: 'not_paid',
                isFreeEvent: false,
            });
            return res.status(201).json({
                success: true,
                data: { booking, paymentInfo: event.paymentInfo },
                message: 'Seat held. Complete payment and submit your proof.',
            });
        } catch (error) {
            await Event.findByIdAndUpdate(eventId, { $inc: { availableSeats: 1 } });
            if (error.code === 11000) throw httpError(409, 'You already have a booking for this event.');
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

exports.submitPaymentProof = async (req, res, next) => {
    try {
        if (!req.file) throw httpError(400, 'A payment screenshot is required.');

        const booking = await Booking.findById(req.params.bookingId)
            .populate('ownerId', 'name email')
            .populate('eventId', 'title');
        if (!booking) throw httpError(404, 'Booking not found');
        if (!sameId(booking.userId, req.user._id)) throw httpError(403, 'You can only submit proof for your own booking.');
        if (booking.status !== 'pending') throw httpError(400, 'Payment proof can only be submitted for a pending booking.');

        booking.paymentScreenshot = {
            url: `/uploads/payments/${req.file.filename}`,
            filename: req.file.filename,
        };
        booking.paymentStatus = 'paid';
        await booking.save();

        res.json({ success: true, data: booking, message: 'Proof submitted. Awaiting owner approval.' });
        void sendNotification('payment proof notification', () => sendProofSubmittedNotification({
            to: booking.ownerId.email, ownerName: booking.ownerId.name, buyerName: req.user.name,
            buyerEmail: req.user.email, eventTitle: booking.eventId?.title, bookingId: booking._id.toString(),
        }));
    } catch (error) {
        next(error);
    }
};

exports.ownerConfirmBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findOneAndUpdate(
            { _id: req.booking._id, status: 'pending' },
            { $set: { status: 'confirmed', reviewedAt: new Date(), ownerNote: null } },
            { new: true }
        ).populate(userPopulate).populate(eventPopulate);
        if (!booking) throw httpError(400, 'Only a pending booking can be confirmed.');

        if (!booking.paymentScreenshot?.url) {
            console.warn(`Organizer confirmed booking ${booking._id} without payment proof.`);
        }
        res.json({ success: true, data: booking, message: 'Booking confirmed.' });
        sendBookingConfirmed(booking);
    } catch (error) {
        next(error);
    }
};

exports.ownerRejectBooking = async (req, res, next) => {
    try {
        const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
        if (!reason) throw httpError(400, 'A rejection reason is required.');

        const booking = await Booking.findOneAndUpdate(
            { _id: req.booking._id, status: 'pending' },
            { $set: { status: 'rejected', ownerNote: reason, reviewedAt: new Date() } },
            { new: true }
        ).populate(userPopulate).populate(eventPopulate);
        if (!booking) throw httpError(400, 'Only a pending booking can be rejected.');

        await Event.findByIdAndUpdate(booking.eventId._id, { $inc: { availableSeats: 1 } });
        res.json({ success: true, data: booking, message: 'Booking rejected and seat restored.' });
        void sendNotification('booking rejection email', () => sendBookingRejectedEmail(
            booking.userId?.email, booking.userId?.name, booking.eventId?.title, reason
        ));
    } catch (error) {
        next(error);
    }
};

exports.cancelBooking = async (req, res, next) => {
    try {
        const current = await Booking.findById(req.params.id);
        if (!current) throw httpError(404, 'Booking not found');
        if (!sameId(current.userId, req.user._id)) throw httpError(403, 'You can only cancel your own booking.');

        const booking = await Booking.findOneAndUpdate(
            { _id: current._id, status: { $in: ['pending', 'confirmed'] } },
            { $set: { status: 'cancelled' } },
            { new: true }
        ).populate('ownerId', 'name email').populate(userPopulate).populate(eventPopulate);
        if (!booking) throw httpError(400, 'Only pending or confirmed bookings can be cancelled.');

        await Event.findByIdAndUpdate(booking.eventId._id, { $inc: { availableSeats: 1 } });
        res.json({ success: true, data: booking, message: 'Booking cancelled and seat restored.' });

        if (!booking.isFreeEvent && current.status === 'pending' && current.paymentStatus === 'paid') {
            void sendNotification('booking cancellation notification', () => sendOwnerBookingNotification({
                to: booking.ownerId?.email, ownerName: booking.ownerId?.name, buyerName: booking.userId?.name,
                buyerEmail: booking.userId?.email, eventTitle: booking.eventId?.title, amount: booking.amount,
                cancellation: true,
            }));
        }
    } catch (error) {
        next(error);
    }
};

exports.getOwnedBookings = async (req, res, next) => {
    try {
        const filter = { ownerId: req.user._id };
        if (req.query.status) {
            const allowedStatuses = new Set(['pending', 'confirmed', 'rejected', 'cancelled']);
            if (!allowedStatuses.has(req.query.status)) throw httpError(400, 'Invalid booking status filter.');
            filter.status = req.query.status;
        }
        if (req.query.eventId) filter.eventId = req.query.eventId;

        const pagination = getPagination(req.query);
        const [bookings, total] = await Promise.all([
            Booking.find(filter).populate(userPopulate).populate(eventPopulate).sort({ createdAt: -1 })
                .skip(pagination.skip).limit(pagination.limit),
            Booking.countDocuments(filter),
        ]);
        res.json({ success: true, data: { bookings, pagination: paginationMetadata(pagination, total) }, message: 'Owned bookings retrieved.' });
    } catch (error) {
        next(error);
    }
};

exports.getOwnedBookingSummary = async (req, res, next) => {
    try {
        const ownerId = req.user._id;
        const [totalEvents, totals] = await Promise.all([
            Event.countDocuments({ createdBy: ownerId }),
            Booking.aggregate([
                { $match: { ownerId } },
                {
                    $group: {
                        _id: null,
                        totalBookings: { $sum: 1 },
                        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                        confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
                        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                        totalRevenue: {
                            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, '$amount', 0] },
                        },
                    },
                },
            ]),
        ]);
        const summary = totals[0] || { totalBookings: 0, pending: 0, confirmed: 0, rejected: 0, totalRevenue: 0 };
        res.json({ success: true, data: { totalEvents, ...summary }, message: 'Owner booking summary retrieved.' });
    } catch (error) {
        next(error);
    }
};

exports.getAllBookings = async (req, res, next) => {
    try {
        const pagination = getPagination(req.query);
        const [bookings, total] = await Promise.all([
            Booking.find().populate(userPopulate).populate(eventPopulate).sort({ createdAt: -1 })
                .skip(pagination.skip).limit(pagination.limit),
            Booking.countDocuments(),
        ]);
        res.json({ success: true, data: { bookings, pagination: paginationMetadata(pagination, total) }, message: 'All bookings retrieved.' });
    } catch (error) {
        next(error);
    }
};

exports.getMyBookings = async (req, res, next) => {
    try {
        const pagination = getPagination(req.query);
        const filter = { userId: req.user._id };
        const [bookings, total] = await Promise.all([
            Booking.find(filter).populate(eventPopulate).sort({ createdAt: -1 })
                .skip(pagination.skip).limit(pagination.limit),
            Booking.countDocuments(filter),
        ]);
        res.json({ success: true, data: { bookings, pagination: paginationMetadata(pagination, total) }, message: 'Your bookings retrieved.' });
    } catch (error) {
        next(error);
    }
};

exports.viewPaymentProof = async (req, res, next) => {
    try {
        const booking = req.booking;
        if (!booking.paymentScreenshot?.filename) throw httpError(404, 'Payment proof not found.');

        const proofPath = path.resolve(__dirname, '..', 'uploads', 'payments', booking.paymentScreenshot.filename);
        const paymentsDirectory = path.resolve(__dirname, '..', 'uploads', 'payments');
        if (!proofPath.startsWith(`${paymentsDirectory}${path.sep}`) || !fs.existsSync(proofPath)) {
            throw httpError(404, 'Payment proof file not found.');
        }
        return res.sendFile(proofPath);
    } catch (error) {
        return next(error);
    }
};
