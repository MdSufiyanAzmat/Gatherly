const { Queue } = require('bullmq');
const connection = require('../config/redis');

const emailQueue = new Queue('email-queue', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});

/**
 * Adds an email job without allowing Redis failures to affect an HTTP response.
 * Callers intentionally do not need to await this function.
 */
const safeEnqueue = async (jobName, data, options = {}) => {
    try {
        await emailQueue.add(jobName, data, options);
        return { ok: true };
    } catch (error) {
        return { ok: false, error: error.message };
    }
};

module.exports = emailQueue;
module.exports.safeEnqueue = safeEnqueue;
