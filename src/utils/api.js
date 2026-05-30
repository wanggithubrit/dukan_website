import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dukan-backend-0cc9.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('dukan_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors for debugging
    if (error.response) {
      console.error(`API Error: ${error.response.status}`, error.response.data);
    } else if (error.request) {
        // include request URL when available and mark timeouts separately
        const url = error.config?.url ? `${error.config.baseURL || ''}${error.config.url}` : 'unknown URL';
        if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) {
          console.warn('API Network Timeout:', error.message, url);
          error.isTimeout = true;
        } else {
          console.error('API Network Error:', error.message, url);
        }
    } else {
      console.error('API Error:', error.message);
    }

    // Handle 401 - token expired
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('dukan_token');
      localStorage.removeItem('dukan_user');
    }

    return Promise.reject(error);
  }
);

export default api;
