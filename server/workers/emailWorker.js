const { Worker } = require('bullmq');
const connection = require('../config/redis');
const emailService = require('../services/emailService');

const handlers = {
    'welcome-email': ({ to, name }) => emailService.sendWelcomeEmail(to, name),
    'registration-link-email': ({ to, name, eventTitle, registrationLink }) => emailService.sendRegistrationLinkEmail(to, name, eventTitle, registrationLink),
    'registration-confirmation-email': ({ to, name, eventTitle }) => emailService.sendRegistrationConfirmationEmail(to, name, eventTitle),
    'booking-confirmed-email': ({ to, name, eventTitle, amount }) => emailService.sendBookingConfirmedEmail(to, name, eventTitle, amount),
    'booking-rejected-email': ({ to, name, eventTitle, reason, isAutoCancelled, eventCancelled }) => emailService.sendBookingRejectedEmail(to, name, eventTitle, reason, { isAutoCancelled, eventCancelled }),
    'booking-new-owner-notify': (data) => emailService.sendOwnerBookingNotification(data),
    'booking-proof-submitted-owner-notify': (data) => emailService.sendProofSubmittedNotification(data),
    'new-event-email': (data) => emailService.sendNewEventEmail(data),
};

const emailWorker = new Worker(
    'email-queue',
    async (job) => {
        const handler = handlers[job.name];
        if (!handler) throw new Error(`Unsupported email job: ${job.name}`);
        await handler(job.data);
    },
    { connection }
);

emailWorker.on('failed', (job, error) => {
    console.error(`Email job ${job?.id ?? 'unknown'} failed:`, error.message);
});

module.exports = emailWorker;
