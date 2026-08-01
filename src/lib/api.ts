import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('gatherup_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthRequest = url.includes('/api/auth/google');

    if (status === 401 && typeof window !== 'undefined' && !isAuthRequest) {
      localStorage.removeItem('gatherup_user_id');
      localStorage.removeItem('gatherup_nickname');
      localStorage.removeItem('gatherup_auth_token');
      localStorage.removeItem('gatherup_profile_image_url');
      localStorage.removeItem('gatherup_theme');
      localStorage.removeItem('gatherup_cached_rooms');
      localStorage.removeItem('gatherup_cached_schedules');
      window.location.reload();
    }

    return Promise.reject(error);
  }
);

export default api;
