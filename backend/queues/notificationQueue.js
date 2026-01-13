// Queue infrastructure for notification processing
require('dotenv').config();
const Queue = require('bull');
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error('❌ REDIS_URL environment variable is MISSING. Falling back to localhost.');
} else {
  console.log('✅ REDIS_URL found:', REDIS_URL.replace(/:[^:@]*@/, ':****@')); // Log masked URL
}

const redisUrl = REDIS_URL || 'redis://localhost:6379';

// Create Redis clients for Bull
const createRedisClient = (type) => {
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined, // Handle TLS/SSL
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  client.on('error', (err) => {
    console.error(`❌ Redis ${type} error:`, err.message);
  });

  client.on('connect', () => {
    console.log(`✅ Redis ${type} connected`);
  });

  return client;
};

// Queue configuration
const queueOptions = {
  createClient: (type) => {
    switch (type) {
      case 'client':
        return createRedisClient('client');
      case 'subscriber':
        return createRedisClient('subscriber');
      case 'bclient':
        return createRedisClient('bclient');
      default:
        return createRedisClient('default');
    }
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};

// Create queues
const pushQueue = new Queue('push-notifications', queueOptions);
const emailQueue = new Queue('email-notifications', queueOptions);

// Queue event listeners
pushQueue.on('error', (error) => {
  console.error('❌ Push queue error:', error.message);
});

emailQueue.on('error', (error) => {
  console.error('❌ Email queue error:', error.message);
});

pushQueue.on('completed', (job, result) => {
  console.log(`✅ Push job ${job.id} completed:`, result.status);
});

pushQueue.on('failed', (job, err) => {
  console.error(`❌ Push job ${job.id} failed:`, err.message);
});

emailQueue.on('completed', (job, result) => {
  console.log(`✅ Email job ${job.id} completed:`, result.status);
});

emailQueue.on('failed', (job, err) => {
  console.error(`❌ Email job ${job.id} failed:`, err.message);
});

/**
 * Enqueue push notification job
 * @param {Object} data - Job data
 * @param {string} data.notificationId - MongoDB notification ID
 * @param {string} data.userId - User ID
 * @param {string} data.title - Notification title
 * @param {string} data.body - Notification body
 * @param {string} data.type - Notification type
 * @param {string} data.priority - Priority level
 * @returns {Promise<Job>}
 */
async function enqueuePush(data) {
  const jobOptions = {
    priority: data.priority === 'high' ? 1 : data.priority === 'medium' ? 5 : 10,
  };

  return pushQueue.add(data, jobOptions);
}

/**
 * Enqueue email notification job
 * @param {Object} data - Job data
 * @param {string} data.notificationId - MongoDB notification ID
 * @param {string} data.userId - User ID
 * @param {string} data.userEmail - User email address
 * @param {string} data.userName - User name
 * @param {string} data.title - Notification title
 * @param {string} data.body - Notification body
 * @param {string} data.type - Notification type
 * @param {string} data.priority - Priority level
 * @returns {Promise<Job>}
 */
async function enqueueEmail(data) {
  const jobOptions = {
    priority: data.priority === 'high' ? 1 : data.priority === 'medium' ? 5 : 10,
  };

  return emailQueue.add(data, jobOptions);
}

/**
 * Get queue statistics
 * @returns {Promise<Object>}
 */
async function getQueueStats() {
  const [pushCounts, emailCounts, pushWaiting, pushActive, pushCompleted, pushFailed, emailWaiting, emailActive, emailCompleted, emailFailed] = await Promise.all([
    pushQueue.getJobCounts(),
    emailQueue.getJobCounts(),
    pushQueue.getWaiting(),
    pushQueue.getActive(),
    pushQueue.getCompleted(),
    pushQueue.getFailed(),
    emailQueue.getWaiting(),
    emailQueue.getActive(),
    emailQueue.getCompleted(),
    emailQueue.getFailed(),
  ]);

  return {
    push: {
      counts: pushCounts,
      waiting: pushWaiting.length,
      active: pushActive.length,
      completed: pushCompleted.length,
      failed: pushFailed.length,
      recentWaiting: pushWaiting.slice(0, 5).map(j => ({ id: j.id, data: j.data })),
      recentFailed: pushFailed.slice(0, 5).map(j => ({ id: j.id, failedReason: j.failedReason, data: j.data })),
    },
    email: {
      counts: emailCounts,
      waiting: emailWaiting.length,
      active: emailActive.length,
      completed: emailCompleted.length,
      failed: emailFailed.length,
      recentWaiting: emailWaiting.slice(0, 5).map(j => ({ id: j.id, data: j.data })),
      recentFailed: emailFailed.slice(0, 5).map(j => ({ id: j.id, failedReason: j.failedReason, data: j.data })),
    },
  };
}

/**
 * Clean old jobs from queues
 * @param {number} grace - Grace period in milliseconds
 * @returns {Promise<Object>}
 */
async function cleanOldJobs(grace = 24 * 3600 * 1000) {
  const [pushCleaned, emailCleaned] = await Promise.all([
    pushQueue.clean(grace, 'completed'),
    emailQueue.clean(grace, 'completed'),
  ]);

  return {
    pushCleaned,
    emailCleaned,
  };
}

/**
 * Gracefully close queue connections
 */
async function closeQueues() {
  console.log('Closing queue connections...');
  await Promise.all([
    pushQueue.close(),
    emailQueue.close(),
  ]);
  console.log('✅ Queues closed');
}

module.exports = {
  pushQueue,
  emailQueue,
  enqueuePush,
  enqueueEmail,
  getQueueStats,
  cleanOldJobs,
  closeQueues,
};
