const { Queue, Worker } = require('bullmq');
const connection = require('../config/redis');
const { cancelStalePendingBookings } = require('../services/bookingCleanupService');

const queueName = 'booking-cleanup-queue';
const bookingCleanupQueue = new Queue(queueName, { connection });

/** Creates one BullMQ hourly scheduler even when the API is restarted. */
const ensureStaleBookingCleanupSchedule = async () => bookingCleanupQueue.upsertJobScheduler(
    'cancel-stale-pending-bookings-hourly',
    { pattern: '0 * * * *' },
    { name: 'cancel-stale-pending-bookings', data: {} }
);

/** Starts the worker that executes stale-hold cleanup jobs. */
const startBookingCleanupWorker = () => {
    const worker = new Worker(queueName, async (job) => {
        if (job.name !== 'cancel-stale-pending-bookings') {
            throw new Error(`Unsupported cleanup job: ${job.name}`);
        }
        return cancelStalePendingBookings();
    }, { connection });

    worker.on('failed', (job, error) => {
        console.error(`Booking cleanup job ${job?.id ?? 'unknown'} failed:`, error.message);
    });
    return worker;
};

module.exports = { bookingCleanupQueue, ensureStaleBookingCleanupSchedule, startBookingCleanupWorker };
