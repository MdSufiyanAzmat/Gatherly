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

module.exports = new Redis(connectionOptions);
