const Subscription = require('../models/subscription');
const { sendNewEventEmail, sendNotification } = require('./emailService');

/** Send one new-event email directly to every active newsletter subscriber. */
const notifySubscribersOfNewEvent = async (event) => {
    const subscribers = await Subscription.find({ active: true }).select('email').lean();
    await Promise.all(subscribers.map(({ email }) => sendNotification('new event email', () => sendNewEventEmail({
        to: email, eventTitle: event.title, eventDate: event.date,
        eventLocation: event.location, eventId: event._id.toString(),
    }))));
};

module.exports = { notifySubscribersOfNewEvent };
