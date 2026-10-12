const Subscription = require('../models/subscription');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.subscribe = async (req, res, next) => {
    try {
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        if (!emailPattern.test(email)) {
            const error = new Error('Enter a valid email address.');
            error.statusCode = 400;
            throw error;
        }

        const registeredEmail = req.user.email.trim().toLowerCase();
        if (email !== registeredEmail) {
            const error = new Error('You can only subscribe with the email used to register your account.');
            error.statusCode = 400;
            throw error;
        }

        await Subscription.findOneAndUpdate(
            { email: registeredEmail },
            { $set: { active: true } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(201).json({ success: true, data: { email: registeredEmail }, message: 'Subscription saved.' });
    } catch (error) {
        next(error);
    }
};
