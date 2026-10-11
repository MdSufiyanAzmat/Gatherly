const dotenv = require('dotenv');
const Redis = require('ioredis');

dotenv.config();

const connectionOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    // Required by BullMQ workers so Redis commands wait through reconnects.
    maxRetriesPerRequest: null,
};

if (process.env.REDIS_PASSWORD) {
    connectionOptions.password = process.env.REDIS_PASSWORD;
}

const connection = new Redis(connectionOptions);

// Redis is optional for HTTP requests: queues reconnect in the background and
// safeEnqueue makes notification failures non-blocking.
connection.on('connect', () => console.log('Redis connected'));
connection.on('error', (error) => console.error('Redis connection error:', error.message));

module.exports = connection;
