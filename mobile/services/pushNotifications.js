// Push notification service using Expo Notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

/**
 * Note: Notification handler is now configured in App.js at app startup
 * This ensures it's set up before any notifications are received
 * and handles notifications in ALL app states:
 * - Foreground: Shows alert with sound and badge
 * - Background: System handles notification display
 * - Killed/Inactive: System handles notification display
 */

/**
 * Get or generate a unique device ID for this device
 * @returns {Promise<string>} Unique device identifier
 */
async function getDeviceId() {
  try {
    // Try to get existing device ID from storage
    let deviceId = await AsyncStorage.getItem('deviceId');
    
    if (!deviceId) {
      // Generate new device ID based on device info
      const deviceInfo = {
        brand: Device.brand || 'unknown',
        model: Device.modelName || 'unknown',
        os: Platform.OS,
        osVersion: Device.osVersion || 'unknown',
        timestamp: Date.now(),
        random: Math.random().toString(36).substring(7),
      };
      
      deviceId = `${deviceInfo.os}-${deviceInfo.brand}-${deviceInfo.model}-${deviceInfo.timestamp}-${deviceInfo.random}`
        .replace(/\s+/g, '-')
        .toLowerCase();
      
      // Save for future use
      await AsyncStorage.setItem('deviceId', deviceId);
      console.log('📱 Generated new device ID:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to random ID
    return `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Register for push notifications and get Expo Push Token
 * @param {string} userId - Current user ID
 * @returns {Promise<string|null>} Expo push token or null if failed
 */
export async function registerForPushNotifications(userId) {
  try {
    // Check if physical device (push notifications don't work on simulator)
    if (!Device.isDevice) {
      console.log('⚠️  Push notifications only work on physical devices');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Push notification permissions denied');
      return null;
    }

    // Get unique device ID
    const deviceId = await getDeviceId();

    // Get the Expo push token (projectId from app.json)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.error('❌ No projectId found in app.json extra.eas.projectId');
      return null;
    }
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    const expoPushToken = tokenData.data;
    console.log('📱 Expo Push Token:', expoPushToken);
    console.log('📱 Device ID:', deviceId);

    // Convert Expo token to FCM token (for Android) or use directly (for iOS)
    let deviceToken = expoPushToken;

    // For Android, we can get the native FCM token if needed
    if (Platform.OS === 'android') {
      try {
        const fcmToken = await Notifications.getDevicePushTokenAsync();
        deviceToken = fcmToken.data; // This is the actual FCM token
        console.log('📱 FCM Token (Android):', deviceToken);
      } catch (error) {
        console.log('⚠️  Could not get FCM token, using Expo token:', error.message);
      }
    }

    // Register device with backend using new multi-device API
    if (userId && deviceToken && deviceId) {
      try {
        await api.addDevice(userId, {
          deviceToken,
          deviceId,
          platform: Platform.OS,
        });
        console.log('✅ Device registered with backend (multi-device support)');
      } catch (error) {
        console.error('❌ Failed to register device with backend:', error);
      }
    }

    return deviceToken;
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Set up notification listeners
 * @param {Function} onNotificationReceived - Callback when notification is received
 * @param {Function} onNotificationTapped - Callback when notification is tapped
 * @returns {Object} Subscriptions to clean up
 */
export function setupNotificationListeners(onNotificationReceived, onNotificationTapped) {
  // Handle notification received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📬 Notification received:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Handle user tapping on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification tapped:', response);
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  return {
    notificationListener,
    responseListener,
    remove: () => {
      notificationListener.remove();
      responseListener.remove();
    },
  };
}

/**
 * Unregister device from push notifications (on logout)
 * @param {string} userId - Current user ID
 */
export async function unregisterDevice(userId) {
  try {
    const deviceId = await getDeviceId();
    
    if (userId && deviceId) {
      await api.removeDevice(userId, deviceId);
      console.log('✅ Device unregistered from backend');
    }
  } catch (error) {
    console.error('❌ Failed to unregister device:', error);
  }
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Show immediately
  });
}

/**
 * Get notification permissions status
 */
export async function getNotificationPermissions() {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
