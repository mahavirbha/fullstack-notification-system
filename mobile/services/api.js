import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Auto-detect dev server IP from Expo (no hardcoded IP needed)
function getApiUrl() {
  return 'https://fullstack-notification-system-production.up.railway.app';
  
  /*
  // Production: use env var
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Development: auto-detect from Expo's debuggerHost
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  let host = debuggerHost ? debuggerHost.split(':')[0] : null;
  
  // On Android emulator, localhost doesn't work - must use 10.0.2.2
  if (Platform.OS === 'android' && (!host || host === 'localhost')) {
    return 'http://10.0.2.2:3000';
  }
  
  // If we have a valid host from debugger, use it
  if (host) {
    return `http://${host}:3000`;
  }
  
  // Fallback for web/iOS
  return 'http://localhost:3000';
  */
}

const API_URL = getApiUrl();
const MOCK_DELAY_MS = 300; // simulate network latency for assignment requirements

console.log('📡 API URL:', API_URL); // Debug log to verify correct URL

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, options);
  // simulate delay for list endpoints to meet assignment criteria
  if (path.startsWith('/api/notifications')) {
    await delay(MOCK_DELAY_MS);
  }
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error || 'Request failed');
  }
  return json;
}

export const api = {
  // Users
  createUser: (email, name) =>
    request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    }),

  listUsers: (params = {}) => {
    const searchParams = new URLSearchParams({ page: 1, limit: 20, ...params });
    return request(`/api/users?${searchParams.toString()}`);
  },

  // Multi-device support
  addDevice: (userId, deviceData) =>
    request(`/api/users/${userId}/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData),
    }),

  removeDevice: (userId, deviceId) =>
    request(`/api/users/${userId}/devices/${deviceId}`, {
      method: 'DELETE',
    }),

  // Notifications
  createNotification: (notification) =>
    request('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    }),

  getNotifications: (userId, params = {}) => {
    const searchParams = new URLSearchParams({ userId, page: 1, limit: 20, ...params });
    return request(`/api/notifications?${searchParams.toString()}`);
  },

  getNotificationDetail: (id) => request(`/api/notifications/${id}`),

  markAsRead: (notificationId) =>
    request(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    }),

  getStats: (userId) => request(`/api/stats?userId=${userId}`),

  seedNotifications: (userId, count = 50) =>
    request('/api/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, count }),
    }),
};
