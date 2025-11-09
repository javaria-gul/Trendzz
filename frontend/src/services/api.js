// src/services/api.js
import axios from "axios";

const BASE_URL = "http://localhost:5000"; 

const API = axios.create({
  baseURL: `${BASE_URL}/api`, // our backend mounted routes at /api
});

// Attach token automatically if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("trendzz_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
