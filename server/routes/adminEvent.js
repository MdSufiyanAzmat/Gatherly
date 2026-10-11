const express = require('express');
const { protect, adminOnly } = require('../middlewares/protect');
const eventUpload = require('../config/multerEvent');
const { submitAdminEvent } = require('../controllers/eventController');

const router = express.Router();

router.post('/events', protect, adminOnly, eventUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'qrCode', maxCount: 1 },
]), submitAdminEvent);

module.exports = router;
