// frontend/src/services/api.js
import axios from 'axios';
import postsService from './posts.js';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

// Set JSON content-type by default for non-FormData requests
api.defaults.headers.common['Accept'] = 'application/json';

// Request interceptor for adding token
api.interceptors.request.use(
  (config) => {
    // Use the Trendzz auth key stored by AuthContext
    const token = localStorage.getItem('trendzz_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Re-export posts API for components importing from api.js
export const postsAPI = postsService;

export default api;