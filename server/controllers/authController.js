const crypto = require('crypto');
const User = require('../models/user');
const OTP = require('../models/OTP');
const { sendOtpEmail, sendWelcomeEmail, sendNotification } = require('../services/emailService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const BCRYPT_ROUNDS = 10;

const DUMMY_HASH = bcrypt.hashSync('dummyPassword', BCRYPT_ROUNDS);

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.SECRET_KEY, { expiresIn: '7d' });
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

const isValidEmail = (v) => isNonEmptyString(v) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const isStrongEnoughPassword = (v) => typeof v === 'string' && v.length >= 8;

const safeEqual = (a, b) => {
    const bufA = Buffer.from(String(a ?? ''));
    const bufB = Buffer.from(String(b ?? ''));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
};

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

exports.registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role = 'user', adminRegistrationCode } = req.body;

    if (!isNonEmptyString(name))
        return res.status(400).json({ message: 'Name is required.' });

    if (!isValidEmail(email))
        return res.status(400).json({ message: 'A valid email is required.' });

    if (!isStrongEnoughPassword(password))
        return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    if (typeof role !== 'string' || !['user', 'admin'].includes(role))
        return res.status(400).json({ message: 'Please choose a valid account type.' });

    if (role === 'admin') {
        if (!process.env.ADMIN_REGISTRATION_CODE ||
            !safeEqual(adminRegistrationCode, process.env.ADMIN_REGISTRATION_CODE)) {
            return res.status(403).json({ message: 'A valid admin registration code is required.' });
        }
    }

    const userExists = await User.findOne({ email: { $eq: email } }).lean();
    if (userExists) {
        return res.status(400).json({ error: 'User already exists.' });
    }

    try {
        const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            isVerified: false,
        });

        const otp = generateOtp();
        await OTP.deleteMany({ email, action: 'account_verification' });
        await OTP.create({
            email,
            otp,
            action: 'account_verification',
            expiresAt: new Date(Date.now() + OTP_TTL_MS),
        });

        sendOtpEmail(email, otp, 'account_verification').catch((err) =>
            console.error('sendOtpEmail failed:', err)
        );

        return res.status(201).json({
            message: 'User registered Successfully. Please check your email for otp verification.',
            email: user.email,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'User already exists.' });
        }
        console.error('registerUser error:', error);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

exports.loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const FAIL = { message: 'Login failed; Invalid user ID or password' };

    if (!isValidEmail(email) || typeof password !== 'string') {
        return res.status(400).json(FAIL);
    }

    const user = await User.findOne({ email: { $eq: email } });

    const hashToCompare = user ? user.password : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !isMatch) {
        return res.status(400).json(FAIL);
    }

    if (!user.isVerified) {
        const otp = generateOtp();
        await OTP.deleteMany({ email, action: 'account_verification' });
        await OTP.create({
            email,
            otp,
            action: 'account_verification',
            expiresAt: new Date(Date.now() + OTP_TTL_MS),
        });
        sendOtpEmail(email, otp, 'account_verification').catch((err) =>
            console.error('sendOtpEmail failed:', err)
        );
        return res.status(400).json({
            message: 'Account not verified. A new OTP has been sent to your registered email.',
            needsVerification: true,
        });
    }

    return res.json({
        message: 'Login Successful!',
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
    });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!isValidEmail(email) || typeof otp !== 'string') {
        return res.status(400).json({ message: 'Invalid or otp expired.' });
    }

    const otpRecord = await OTP.findOne({
        email: { $eq: email },
        otp: { $eq: otp },
        action: 'account_verification',
        expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
        return res.status(400).json({ message: 'Invalid or otp expired.' });
    }

    const user = await User.findOneAndUpdate(
        { email: { $eq: email } },
        { isVerified: true },
        { new: true }
    );

    if (!user) {
        return res.status(400).json({ message: 'Invalid or otp expired.' });
    }

    await OTP.deleteMany({ email: { $eq: email }, action: 'account_verification' });

    void sendNotification('welcome email', () => sendWelcomeEmail(user.email, user.name))
        .catch?.((err) => console.error('sendWelcomeEmail failed:', err));

    return res.json({
        message: 'Account verified successfully you can log in now.',
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
    });
});