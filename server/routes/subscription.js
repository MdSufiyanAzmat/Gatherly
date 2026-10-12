const express = require('express');
const { subscribe } = require('../controllers/subscriptionController');
const { protect } = require('../middlewares/protect');

const router = express.Router();

router.post('/', protect, subscribe);

module.exports = router;
