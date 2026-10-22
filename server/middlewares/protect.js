const jwt = require('jsonwebtoken');
const User = require('../models/user');

const getToken = (req) => {
    if (req.cookies?.token) return req.cookies.token;
    if (req.headers.authorization?.startsWith('Bearer '))
        return req.headers.authorization.split(' ')[1];
    return null;
};

const protect = async (req, res, next) => {
    const token = getToken(req);

    if (!token)
        return res.status(401).json({ success: false, data: null, message: 'No token found' });

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user)
            return res.status(401).json({ success: false, data: null, message: 'Not authorized! User not found.' });
        next();
    } catch {
        return res.status(401).json({ success: false, data: null, message: 'Token failed' });
    }
};

const optionalAuth = async (req, res, next) => {
    const token = getToken(req);
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findById(decoded.id).select('-password');
        if (user) req.user = user;
        next();
    } catch {
        next();
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') return next();
    return res.status(403).json({ success: false, data: null, message: 'Access denied! Admin access required.' });
};

const userOnly = (req, res, next) => {
    if (req.user?.role === 'user') return next();
    return res.status(403).json({ success: false, data: null, message: 'This action is available to user accounts only.' });
};

module.exports = { protect, optionalAuth, adminOnly, userOnly, admin: adminOnly };
