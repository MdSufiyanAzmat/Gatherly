const { Worker } = require('bullmq');
const connection = require('../config/redis');
const { sendWelcomeEmail } = require('../services/emailService');

const emailWorker = new Worker(
    'email-queue',
    async (job) => {
        if (job.name !== 'welcome-email') {
            throw new Error(`Unsupported email job: ${job.name}`);
        }

        const { to, name } = job.data;
        await sendWelcomeEmail(to, name);
        console.log(`Welcome email sent to ${to}`);
    },
    { connection }
);

emailWorker.on('failed', (job, error) => {
    console.error(`Email job ${job?.id ?? 'unknown'} failed:`, error.message);
});

module.exports = emailWorker;
