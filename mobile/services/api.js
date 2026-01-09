// Configurable API base
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.5:3000'; // change per network
const MOCK_DELAY_MS = 300; // simulate network latency for assignment requirements

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
