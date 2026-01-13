// API Service for Admin Panel
const API_URL = 'https://fullstack-notification-system-production.up.railway.app';

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${path}]:`, error);
    throw error;
  }
}

export const api = {
  // Get all notifications (admin - no userId filter)
  getNotifications: (params = {}) => {
    const query = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...params,
    });
    return request(`/api/admin/notifications?${query}`);
  },

  // Get notification by ID
  getNotification: (id) => request(`/api/notifications/${id}`),

  // Create new notification
  createNotification: (data) =>
    request('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Resend notification (mock)
  resendNotification: (id) =>
    request(`/api/notifications/${id}/resend`, {
      method: 'POST',
    }),

  // Get all users
  getUsers: () => request('/api/admin/users'),

  // Get queue statistics
  getQueueStats: () => request('/api/queue/stats'),
};
