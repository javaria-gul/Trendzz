// src/services/api.js 
import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

// Create axios instance
const API = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ✅ SINGLE Request Interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("trendzz_token");
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // For multipart/form-data, don't overwrite Content-Type
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  console.log('📡 API Request:', {
    url: config.url,
    method: config.method,
    hasToken: !!token
  });
  
  return config;
}, (error) => {
  console.error('❌ Request interceptor error:', error);
  return Promise.reject(error);
});

// ✅ SINGLE Response Interceptor
API.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    
    // Return axios response object directly
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      response: error.response?.data
    });
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("trendzz_token");
      localStorage.removeItem("trendzz_user");
      window.location.href = "/login";
    }
    
    // Return error in consistent format
    return Promise.reject({
      success: false,
      message: error.response?.data?.message || error.message || 'Network error',
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// ✅ CHAT API (Add this section)
export const chatAPI = {
  // Get all chats
  getChats: () => API.get('/chats'),
  
  // Start a new chat
  startChat: (receiverId) => API.post('/chats/start', { receiverId }),
  
  // Get messages for a chat
  getMessages: (chatId, page = 1) => 
    API.get(`/chats/${chatId}/messages`, { params: { page } }),
  
  // Send a message
  sendMessage: (chatId, messageData) => 
    API.post(`/chats/${chatId}/messages`, messageData),
  
  // Mark messages as read
  markAsRead: (chatId) => 
    API.put(`/chats/${chatId}/read`),
  
  // Delete a message
  deleteMessage: (messageId) => 
    API.delete(`/messages/${messageId}`),
  
  // React to a message
  reactToMessage: (messageId, emoji) => 
    API.post(`/messages/${messageId}/react`, { emoji }),
};

// ✅ POSTS API
export const postsAPI = {
  createPost: async (formData, onUploadProgress) => {
    try {
      const token = localStorage.getItem("trendzz_token");
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.post(`${BASE_URL}/posts`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData
        },
        onUploadProgress
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Create post error:', error);
      throw error.response?.data || error;
    }
  },
  
  getPosts: (page = 1, limit = 10) => 
    API.get('/posts', { params: { page, limit } }),
  
  getUserPosts: (userId, page = 1, limit = 10) => 
    API.get(`/posts/user/${userId}`, { params: { page, limit } }),
  
  likePost: (postId) => API.post(`/posts/${postId}/like`),
  
  addComment: (postId, text) => 
    API.post('/posts/comment', { postId, text }),
  
  deletePost: (postId) => API.delete(`/posts/${postId}`),
};

// ✅ AUTH API
export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  testConnection: () => API.get('/auth/test-connection'),
  logout: () => API.post('/auth/logout'),
};

export default API;