const Booking = require('../models/booking');

const assertBookingOwner = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, data: null, message: 'Booking not found' });
        }

        const isOwner = booking.ownerId.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, data: null, message: 'Only the event owner can review this booking' });
        }

        req.booking = booking;
        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports = { assertBookingOwner };
