require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const { enqueueEmail, enqueuePush, closeQueues } = require('./queues/notificationQueue');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

async function run() {
  console.log('--- Manual Notification Trigger ---');
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const users = db.collection('users');
    const notifications = db.collection('notifications');

    // Find the user
    // Using the email we saw in the previous turn
    const targetEmail = 'mahavirsinhchauhan29@gmail.com';
    const user = await users.findOne({ email: targetEmail });
    
    if (!user) {
      console.error(`❌ User ${targetEmail} not found in database!`);
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user._id})`);

    // Create Notification object
    const notification = {
      type: 'success', // Using success type for green badge
      title: 'System Verification',
      body: `This is a verification email sent at ${new Date().toLocaleTimeString()} to confirm end-to-end delivery.`,
      userId: user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      channels: {
        push: { status: 'pending', provider: 'fcm', attempts: 0 },
        email: { status: 'pending', provider: 'sendgrid', attempts: 0 },
        inApp: { status: 'unread' }
      },
      priority: 'high'
    };

    // 1. Insert into MongoDB
    const result = await notifications.insertOne(notification);
    const notificationId = result.insertedId.toString();
    console.log(`✅ Created notification in MongoDB: ${notificationId}`);

    // 2. Enqueue Email Job
    await enqueueEmail({
      notificationId,
      userId: user._id.toString(),
      userEmail: user.email,
      userName: user.name,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      priority: 'high'
    });
    console.log('✅ Email job successfully enqueued to Redis');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    // Cleanup
    await client.close();
    await closeQueues();
    console.log('--- Done ---');
    process.exit(0);
  }
}

run();
