import IORedis from 'ioredis';
import { config } from '../config/index.js';

const Redis = (IORedis as any).default ?? IORedis;
const redisOptions = {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 3000,
  // Added: Retry ko rokne ke liye taaki loop mein error na aaye
  retryStrategy: (times: number) => {
    if (!config.redisUrl || config.redisUrl.includes('127.0.0.1') || config.redisUrl.includes('localhost')) {
      return null; // Return null automatically stops retrying
    }
    return Math.min(times * 50, 2000);
  }
};

export const redisClient = new Redis(config.redisUrl, redisOptions);
redisClient.on('error', (error: Error) => {
  // Added: Sirf real errors dikhayega, localhost spam ko silent kar dega
  if (!error.message.includes('ECONNREFUSED 127.0.0.1')) {
    console.error('Redis client error:', error.message);
  }
});

function createClient() {
  const client = new Redis(config.redisUrl, redisOptions);
  client.on('error', (error: Error) => {
    // Added: Same here, silent for localhost spam
    if (!error.message.includes('ECONNREFUSED 127.0.0.1')) {
      console.error('Redis client error:', error.message);
    }
  });
  return client;
}

export function createRedisPublisher() {
  return createClient();
}

export function createRedisSubscriber() {
  return createClient();
}