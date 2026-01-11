// Notification worker - processes push and email jobs from queue
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const { pushQueue, emailQueue } = require('../queues/notificationQueue');
const { sendPush } = require('../services/pushProvider');
const { sendEmail } = require('../services/emailProvider');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'notification_system';

let db;
let notificationsCollection;
let usersCollection;

// Connect to MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    db = client.db(DB_NAME);
    notificationsCollection = db.collection('notifications');
    usersCollection = db.collection('users');
    console.log('✅ Worker connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Worker MongoDB connection error:', error.message);
    process.exit(1);
  }
}

/**
 * Update notification channel status in MongoDB
 */
async function updateNotificationStatus(notificationId, channel, updateData) {
  try {
    const update = {
      $set: {
        [`channels.${channel}.status`]: updateData.status,
        [`channels.${channel}.attempts`]: updateData.attempts,
        updatedAt: new Date(),
      },
    };

    // Add optional fields
    if (updateData.sentAt) {
      update.$set[`channels.${channel}.sentAt`] = updateData.sentAt;
    }
    if (updateData.deliveredAt) {
      update.$set[`channels.${channel}.deliveredAt`] = updateData.deliveredAt;
    }
    if (updateData.error) {
      update.$set[`channels.${channel}.error`] = updateData.error;
    }
    if (updateData.messageId) {
      update.$set[`channels.${channel}.messageId`] = updateData.messageId;
    }

    await notificationsCollection.updateOne(
      { _id: new ObjectId(notificationId) },
      update
    );
  } catch (error) {
    console.error('❌ Error updating notification status:', error.message);
  }
}

/**
 * Get user info from database
 */
async function getUserInfo(userId) {
  try {
    return await usersCollection.findOne({ _id: new ObjectId(userId) });
  } catch (error) {
    console.error('❌ Error fetching user:', error.message);
    return null;
  }
}

/**
 * Process push notification job
 */
async function processPushJob(job) {
  const { notificationId, userId, title, body, type } = job.data;
  
  console.log(`📱 Processing push job ${job.id} for notification ${notificationId}`);

  // Get user info to retrieve devices
  const user = await getUserInfo(userId);
  
  if (!user) {
    console.error(`❌ User ${userId} not found`);
    await updateNotificationStatus(notificationId, 'push', {
      status: 'failed',
      attempts: job.attemptsMade + 1,
      error: 'User not found',
    });
    return { success: false, status: 'failed', error: 'User not found' };
  }

  // Get all registered devices
  const devices = user.devices || [];

  if (devices.length === 0) {
    console.log(`⚠️  No devices registered for user ${userId}`);
    await updateNotificationStatus(notificationId, 'push', {
      status: 'skipped',
      attempts: job.attemptsMade + 1,
      error: 'No devices registered',
    });
    return { success: false, status: 'skipped', error: 'No devices registered' };
  }

  console.log(`📱 Sending push to ${devices.length} device(s) for user ${userId}`);

  // Update status to "sent" (attempting)
  await updateNotificationStatus(notificationId, 'push', {
    status: 'sent',
    attempts: job.attemptsMade + 1,
    sentAt: new Date(),
  });

  // Send to all devices
  const results = await Promise.allSettled(
    devices.map(device => 
      sendPush({
        userId,
        deviceToken: device.token,
        deviceId: device.deviceId,
        platform: device.platform,
        title,
        body,
        type,
        notificationId,
      })
    )
  );

  // Count successes and failures
  const successes = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failures = results.filter(r => r.status === 'rejected' || !r.value?.success).length;

  // Collect message IDs from successful deliveries
  const messageIds = results
    .filter(r => r.status === 'fulfilled' && r.value.success)
    .map(r => r.value.messageId)
    .filter(Boolean);

  // Collect errors from failures
  const errors = results
    .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success))
    .map(r => r.status === 'rejected' ? r.reason?.message : r.value?.error)
    .filter(Boolean);

  try {
    if (successes > 0) {
      // At least one device received it - mark as delivered
      await updateNotificationStatus(notificationId, 'push', {
        status: 'delivered',
        attempts: job.attemptsMade + 1,
        deliveredAt: new Date(),
        messageId: messageIds.join(', '),
        deviceCount: devices.length,
        successCount: successes,
        failureCount: failures,
      });

      console.log(`✅ Push delivered to ${successes}/${devices.length} device(s) for notification ${notificationId}`);
      
      if (failures > 0) {
        console.log(`⚠️  ${failures} device(s) failed: ${errors.join(', ')}`);
      }

      return { 
        success: true, 
        status: 'delivered', 
        deviceCount: devices.length,
        successCount: successes,
        failureCount: failures,
      };
    } else {
      // All devices failed
      throw new Error(`All ${devices.length} device(s) failed: ${errors.join(', ')}`);
    }
  } catch (error) {
    // Update to failed
    await updateNotificationStatus(notificationId, 'push', {
      status: 'failed',
      attempts: job.attemptsMade + 1,
      error: error.message,
      deviceCount: devices.length,
      successCount: successes,
      failureCount: failures,
    });

    console.error(`❌ Push failed for notification ${notificationId}:`, error.message);
    throw error; // Re-throw to trigger Bull retry
  }
}

/**
 * Process email notification job
 */
async function processEmailJob(job) {
  const { notificationId, userId, userEmail, userName, title, body, type } = job.data;
  
  console.log(`📧 Processing email job ${job.id} for notification ${notificationId}`);

  // If user email not provided, fetch from DB
  let email = userEmail;
  let name = userName;
  
  if (!email) {
    const user = await getUserInfo(userId);
    if (user) {
      email = user.email;
      name = user.name;
    }
  }

  if (!email) {
    const error = 'User email not found';
    await updateNotificationStatus(notificationId, 'email', {
      status: 'failed',
      attempts: job.attemptsMade + 1,
      error,
    });
    throw new Error(error);
  }

  // Update status to "sent" (attempting)
  await updateNotificationStatus(notificationId, 'email', {
    status: 'sent',
    attempts: job.attemptsMade + 1,
    sentAt: new Date(),
  });

  try {
    // Send email
    const result = await sendEmail({
      to: email,
      userName: name,
      title,
      body,
      type,
    });

    if (result.success) {
      // Update to delivered
      await updateNotificationStatus(notificationId, 'email', {
        status: 'delivered',
        attempts: job.attemptsMade + 1,
        deliveredAt: new Date(),
        messageId: result.messageId,
      });

      console.log(`✅ Email delivered for notification ${notificationId}`);
      return { success: true, status: 'delivered', messageId: result.messageId };
    } else {
      throw new Error(result.error || 'Email delivery failed');
    }
  } catch (error) {
    // Update to failed
    await updateNotificationStatus(notificationId, 'email', {
      status: 'failed',
      attempts: job.attemptsMade + 1,
      error: error.message,
    });

    console.error(`❌ Email failed for notification ${notificationId}:`, error.message);
    throw error; // Re-throw to trigger Bull retry
  }
}

/**
 * Start workers
 */
async function startWorkers() {
  console.log('=================================');
  console.log('🔧 Notification Workers Starting');
  console.log('=================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Mock Providers: ${process.env.USE_MOCK_PROVIDERS !== 'false'}`);
  console.log('=================================\n');

  // Connect to MongoDB
  await connectDB();

  // Register push queue processor
  pushQueue.process(async (job) => {
    return await processPushJob(job);
  });

  // Register email queue processor
  emailQueue.process(async (job) => {
    return await processEmailJob(job);
  });

  console.log('✅ Push notification worker ready');
  console.log('✅ Email notification worker ready');
  console.log('\n👀 Waiting for jobs...\n');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nSIGTERM received, shutting down workers...');
  await pushQueue.close();
  await emailQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down workers...');
  await pushQueue.close();
  await emailQueue.close();
  process.exit(0);
});

// Start workers
startWorkers().catch((error) => {
  console.error('❌ Worker startup error:', error);
  process.exit(1);
});
