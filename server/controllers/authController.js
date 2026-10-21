const crypto = require('crypto');
const User = require('../models/user');
const OTP = require('../models/OTP');
const { sendOtpEmail, sendWelcomeEmail, sendNotification } = require('../services/emailService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 10;
const NAME_MAX_LEN = 100;
const PASSWORD_MIN_LEN = 8;
const PASSWORD_MAX_LEN = 72;

const DUMMY_HASH = bcrypt.hashSync('dummyPassword', BCRYPT_ROUNDS);

const generateToken = (id, role, verified) =>
    jwt.sign({ id, role, verified }, process.env.SECRET_KEY, { expiresIn: '7d' });

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

const isValidEmail = (v) => isNonEmptyString(v) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const isValidName = (v) => isNonEmptyString(v) && v.trim().length <= NAME_MAX_LEN;

const isValidPassword = (v) =>
    typeof v === 'string' && v.length >= PASSWORD_MIN_LEN && v.length <= PASSWORD_MAX_LEN;

const safeEqual = (a, b) => {
    const bufA = Buffer.from(String(a ?? ''));
    const bufB = Buffer.from(String(b ?? ''));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
};

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const setTokenCookie = (res, token) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });
};

const issueOtp = async (email) => {
    const otp = generateOtp();
    await OTP.deleteMany({ email: { $eq: email }, action: 'account_verification' });
    await OTP.create({
        email,
        otp,
        action: 'account_verification',
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        attempts: 0,
    });
    sendOtpEmail(email, otp, 'account_verification').catch((err) =>
        console.error('sendOtpEmail failed:', err)
    );
};

exports.registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role = 'user', adminRegistrationCode } = req.body;

    if (!isValidName(name))
        return res.status(400).json({ message: `Name must be 1–${NAME_MAX_LEN} characters.` });

    if (!isValidEmail(email))
        return res.status(400).json({ message: 'A valid email is required.' });

    if (!isValidPassword(password))
        return res.status(400).json({
            message: `Password must be ${PASSWORD_MIN_LEN}–${PASSWORD_MAX_LEN} characters.`,
        });

    if (typeof role !== 'string' || !['user', 'admin'].includes(role))
        return res.status(400).json({ message: 'Please choose a valid account type.' });

    if (role === 'admin') {
        if (!process.env.ADMIN_REGISTRATION_CODE ||
            !safeEqual(adminRegistrationCode, process.env.ADMIN_REGISTRATION_CODE)) {
            return res.status(403).json({ message: 'A valid admin registration code is required.' });
        }
    }

    const existing = await User.findOne({ email: { $eq: email } });

    if (existing && existing.isVerified)
        return res.status(400).json({ error: 'User already exists.' });

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    let user;
    if (existing && !existing.isVerified) {
        existing.name = name;
        existing.password = hashedPassword;
        existing.role = role;
        user = await existing.save();
    } else {
        try {
            user = await User.create({
                name,
                email,
                password: hashedPassword,
                role,
                isVerified: false,
            });
        } catch (err) {
            if (err.code === 11000)
                return res.status(400).json({ error: 'User already exists.' });
            console.error('registerUser create error:', err);
            return res.status(500).json({ error: 'Something went wrong. Please try again.' });
        }
    }

    await issueOtp(email);

    return res.status(201).json({
        message: 'User registered. Check your email for the OTP to verify.',
        email: user.email,
        needsVerification: true,
    });
});

exports.loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const FAIL = { message: 'Login failed; Invalid user ID or password' };

    if (!isValidEmail(email) || typeof password !== 'string')
        return res.status(400).json(FAIL);

    const user = await User.findOne({ email: { $eq: email } });
    const hashToCompare = user ? user.password : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !isMatch) return res.status(400).json(FAIL);

    if (!user.isVerified) {
        await issueOtp(email);
        return res.status(400).json({
            message: 'Account not verified. A new OTP has been sent.',
            needsVerification: true,
        });
    }

    setTokenCookie(res, generateToken(user._id, user.role, true));

    return res.json({
        message: 'Login Successful!',
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
    });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!isValidEmail(email) || typeof otp !== 'string')
        return res.status(400).json({ message: 'Invalid or otp expired.' });

    const otpRecord = await OTP.findOne({
        email: { $eq: email },
        action: 'account_verification',
        expiresAt: { $gt: new Date() },
    });

    if (!otpRecord)
        return res.status(400).json({ message: 'Invalid or otp expired.' });

    if ((otpRecord.attempts || 0) >= OTP_MAX_ATTEMPTS) {
        await OTP.deleteMany({ email: { $eq: email }, action: 'account_verification' });
        return res.status(429).json({
            message: 'Too many attempts. Request a new OTP by logging in.',
        });
    }

    if (!safeEqual(otp, otpRecord.otp)) {
        await OTP.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
        const left = OTP_MAX_ATTEMPTS - ((otpRecord.attempts || 0) + 1);
        return res.status(400).json({ message: `Invalid OTP. ${left} attempt(s) remaining.` });
    }

    const user = await User.findOneAndUpdate(
        { email: { $eq: email } },
        { isVerified: true },
        { returnDocument: 'after' }
    );

    if (!user)
        return res.status(400).json({ message: 'Invalid or otp expired.' });

    await OTP.deleteMany({ email: { $eq: email }, action: 'account_verification' });

    sendNotification('welcome email', () => sendWelcomeEmail(user.email, user.name))
        .catch((err) => console.error('sendWelcomeEmail failed:', err));

    setTokenCookie(res, generateToken(user._id, user.role, true));

    return res.json({
        message: 'Account verified. You are now logged in.',
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
    });
});

exports.logoutUser = asyncHandler(async (req, res) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
    });
    return res.json({ message: 'Logged out.' });
});
