const Subscription = require('../models/subscription');
const { safeEnqueue } = require('../queues/emailQueue');

/** Queue one new-event email for every active newsletter subscriber. */
const notifySubscribersOfNewEvent = async (event) => {
    const subscribers = await Subscription.find({ active: true }).select('email').lean();
    await Promise.allSettled(subscribers.map(({ email }) => safeEnqueue('new-event-email', {
        to: email,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        eventId: event._id.toString(),
    })));
};

module.exports = { notifySubscribersOfNewEvent };
