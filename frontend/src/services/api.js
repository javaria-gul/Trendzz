import axios from "axios";

const BASE_URL = "http://localhost:5000"; 

const API = axios.create({
  baseURL: `${BASE_URL}/api`, // our backend mounted routes at /api
});

// Attach token automatically if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("trendzz_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("trendzz_token");
      localStorage.removeItem("trendzz_user");
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;