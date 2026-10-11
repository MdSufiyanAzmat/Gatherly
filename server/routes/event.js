const express = require('express');
const router = express.Router();
const { protect, optionalAuth, adminOnly, userOnly } = require('../middlewares/protect');
const eventUpload = require('../config/multerEvent');
const {
    submitEvent,
    getPublicEvents,
    getEventById,
    getMyEvents,
    getPendingEvents,
    approveEvent,
    rejectEvent,
    deleteEvent,
    registerExternal,
    toggleLike,
    addComment,
} = require('../controllers/eventController');

router.post('/', protect, userOnly, eventUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'qrCode', maxCount: 1 }]), submitEvent);
router.get('/', getPublicEvents);
router.get('/mine', protect, userOnly, getMyEvents);
// Compatibility alias for clients released before the redesign.
router.get('/mine/list', protect, userOnly, getMyEvents);
router.get('/admin/pending', protect, adminOnly, getPendingEvents);
router.patch('/:id/approve', protect, adminOnly, approveEvent);
router.patch('/:id/reject', protect, adminOnly, rejectEvent);
router.post('/:id/register', protect, registerExternal);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comments', protect, addComment);
router.delete('/:id', protect, deleteEvent);
router.get('/:id', optionalAuth, getEventById);

module.exports = router;
