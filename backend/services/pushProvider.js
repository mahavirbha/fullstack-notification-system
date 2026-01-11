// Push notification provider service - supports FCM V1, Expo Push, and mock mode
const USE_MOCK = process.env.USE_MOCK_PROVIDERS !== 'false';
const FIREBASE_SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
const { Expo } = require('expo-server-sdk');

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize Firebase Admin SDK (singleton)
let admin = null;

function initializeFirebase() {
  if (admin) return admin;
  
  try {
    const serviceAccount = require(FIREBASE_SERVICE_ACCOUNT_PATH);
    admin = require('firebase-admin');
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin SDK initialized');
    }
    
    return admin;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
}

/**
 * Mock push provider (for testing without FCM)
 */
class MockPushProvider {
  async send({ userId, title, body, data }) {
    // Simulate network latency
    await delay(800 + Math.random() * 1500);

    // Simulate random failures (15% failure rate)
    if (Math.random() < 0.15) {
      throw new Error('Mock push delivery failed: Device token invalid');
    }

    console.log(`📱 [MOCK] Push sent to user ${userId}: "${title}"`);

    return {
      success: true,
      messageId: `mock-push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      provider: 'mock',
      timestamp: new Date(),
    };
  }
}

/**
 * Expo Push Notificaton Provider (for Expo Go)
 */
class ExpoProvider {
  constructor() {
    this.expo = new Expo();
  }

  async send({ deviceToken, title, body, data }) {
    if (!Expo.isExpoPushToken(deviceToken)) {
      throw new Error(`Invalid Expo token: ${deviceToken}`);
    }

    const messages = [{
      to: deviceToken,
      sound: 'default',
      title,
      body,
      data,
    }];

    try {
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }
      
      const ticket = tickets[0];
      if (ticket.status === 'error') {
        throw new Error(`Expo push failed: ${ticket.message} (${ticket.details?.error})`);
      }

      console.log(`📱 [Expo] Push sent: "${title}"`);

      return {
        success: true,
        messageId: ticket.id,
        provider: 'expo',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Expo Push error:', error);
      throw error;
    }
  }
}

/**
 * Firebase Cloud Messaging V1 provider (official SDK)
 */
class FCMProvider {
  constructor() {
    this.admin = initializeFirebase();
  }

  async send({ deviceToken, title, body, data }) {
    const message = {
      token: deviceToken,
      notification: {
        title,
        body,
      },
      data: data ? Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, String(value)])
      ) : {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    try {
      const response = await this.admin.messaging().send(message);
      console.log(`📱 [FCM V1] Push sent: "${title}"`);
      
      return {
        success: true,
        messageId: response,
        provider: 'fcm-v1',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ FCM error:', error.message);
      
      // Handle specific FCM errors
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        throw new Error('Device token is invalid or expired');
      }
      
      throw new Error(`FCM delivery failed: ${error.message}`);
    }
  }
}

/**
 * Push provider factory
 */
function createPushProvider(deviceToken) {
  if (USE_MOCK) {
    console.log('📱 Using MOCK push provider');
    return new MockPushProvider();
  }

  if (deviceToken && (deviceToken.startsWith('ExponentPushToken') || deviceToken.startsWith('ExpoPushToken'))) {
    console.log('📱 Using Expo Push provider (detected Expo Token)');
    return new ExpoProvider();
  }
  
  try {
    console.log('📱 Using FCM V1 push provider (Firebase Admin SDK)');
    return new FCMProvider();
  } catch (error) {
    console.error('⚠️  FCM initialization failed, falling back to MOCK mode');
    console.error('Error:', error.message);
    return new MockPushProvider();
  }
}

/**
 * Send push notification
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.deviceToken - FCM device token (optional for mock)
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body
 * @param {string} params.type - Notification type
 * @param {string} params.notificationId - MongoDB notification ID
 * @returns {Promise<Object>} Result with success, messageId, provider
 */
async function sendPush({ userId, deviceToken, title, body, type, notificationId }) {
  const provider = createPushProvider(deviceToken);

  const data = {
    type,
    notificationId,
    timestamp: new Date().toISOString(),
  };

  try {
    let result;
    
    if (USE_MOCK) {
      // Mock provider doesn't need device token
      result = await provider.send({
        userId,
        title,
        body,
        data,
      });
    } else {
      // Real FCM/Expo needs device token
      if (!deviceToken) {
        // User hasn't registered for push notifications
        console.log(`⚠️  No device token for user ${userId}, skipping push`);
        return {
          success: false,
          status: 'skipped',
          error: 'No device token registered',
          provider: 'none',
          timestamp: new Date(),
        };
      }
      result = await provider.send({
        deviceToken,
        title,
        body,
        data,
      });
    }

    return {
      success: true,
      status: 'delivered',
      ...result,
    };
  } catch (error) {
    return {
      success: false,
      status: 'failed',
      error: error.message,
      provider: USE_MOCK ? 'mock' : 'unknown',
      timestamp: new Date(),
    };
  }
}

module.exports = {
  sendPush,
};
