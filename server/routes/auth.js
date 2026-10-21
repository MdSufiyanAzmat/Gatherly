const express = require('express')
const router = express.Router()
const { registerUser, loginUser, verifyOtp, logoutUser } = require('../controllers/authController')

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/verifyOtp', verifyOtp)
router.post('/logout', logoutUser)

module.exports = router
