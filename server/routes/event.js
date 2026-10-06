const express = require('express');
const router = express.Router();
const { protect, optionalAuth, adminOnly } = require('../middlewares/protect');
const {
    submitEvent,
    getPublicEvents,
    getEventById,
    getMyEvents,
    getPendingEvents,
    approveEvent,
    rejectEvent,
    deleteEvent,
} = require('../controllers/eventController');

router.post('/', protect, submitEvent);
router.get('/', getPublicEvents);
router.get('/mine/list', protect, getMyEvents);
router.get('/admin/pending', protect, adminOnly, getPendingEvents);
router.patch('/:id/approve', protect, adminOnly, approveEvent);
router.patch('/:id/reject', protect, adminOnly, rejectEvent);
router.delete('/:id', protect, deleteEvent);
router.get('/:id', optionalAuth, getEventById);

module.exports = router;
