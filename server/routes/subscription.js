const express = require('express');
const { subscribe } = require('../controllers/subscriptionController');

const router = express.Router();

router.post('/', subscribe);

module.exports = router;
