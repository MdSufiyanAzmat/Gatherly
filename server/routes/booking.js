const express = require('express');
const router = express.Router();
const {
    createFreeBooking,
    initiatePaidBooking,
    submitPaymentProof,
    ownerConfirmBooking,
    ownerRejectBooking,
    cancelBooking,
    getOwnedBookings,
    getOwnedBookingSummary,
    getAllBookings,
    getMyBookings,
    viewPaymentProof,
} = require('../controllers/bookingController');
const { protect, adminOnly, userOnly } = require('../middlewares/protect');
const { assertBookingOwner } = require('../middlewares/bookingOwnership');
const paymentUpload = require('../config/multerPayment');

router.post('/free/:eventId', protect, userOnly, createFreeBooking);
router.post('/paid/:eventId/initiate', protect, initiatePaidBooking);
router.post('/:bookingId/proof', protect, paymentUpload.single('screenshot'), submitPaymentProof);

router.get('/owned/summary', protect, getOwnedBookingSummary);
router.get('/owned', protect, getOwnedBookings);
router.get('/my', protect, getMyBookings);
router.get('/', protect, adminOnly, getAllBookings);

router.put('/:id/owner-confirm', protect, assertBookingOwner, ownerConfirmBooking);
router.put('/:id/owner-reject', protect, assertBookingOwner, ownerRejectBooking);
router.put('/:id/cancel', protect, cancelBooking);
router.get('/:id/proof-view', protect, assertBookingOwner, viewPaymentProof);

module.exports = router;
