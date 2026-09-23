import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach auth token if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API helper methods
export const api = {
  // Items
  getItems: (params = {}) => apiClient.get('/items', { params }),
  getItemById: (id) => apiClient.get(`/items/${id}`),
  reportItem: (itemData) => apiClient.post('/items', itemData),
  updateItemStatus: (id, statusData) => apiClient.patch(`/items/${id}/status`, statusData),

  // Matches
  getMatchesForItem: (itemId) => apiClient.get(`/matches/${itemId}`),
  updateMatchStatus: (matchId, status) => apiClient.patch(`/matches/${matchId}/status`, { status }),

  // Notifications
  getNotifications: (userId) => apiClient.get('/notifications', { params: { userId } }),
  markNotificationRead: (id, userId) => apiClient.patch(`/notifications/${id}/read`, null, { params: { userId } }),

  // Auth
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getProfile: (userId) => apiClient.get('/auth/profile', { params: { userId } }),
};

export default apiClient;
