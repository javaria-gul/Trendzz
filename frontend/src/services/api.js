// src/services/api.js 
import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

// Create axios instance
const API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
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
  } else if (!config.headers['Content-Type'] && !config.headers['content-type']) {
    config.headers['Content-Type'] = 'application/json';
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

// ✅ CHAT API
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

// ✅ POSTS API - COMPLETE FIXED WITH ALL FUNCTIONS
export const postsAPI = {
  // ✅ 1. getPosts - FOR HomeFeed.jsx (required for error fix)
  getPosts: (page = 1, limit = 100) => 
    API.get("/posts", { params: { page, limit } }),
  
  // ✅ 2. getAllPosts - For other components
  getAllPosts: (page = 1, limit = 100) => 
    API.get("/posts", { params: { page, limit } }),
  
  // ✅ 3. Create post with media
  createPost: async (formData, onUploadProgress) => {
    console.log('📤 Creating post with formData:', {
      hasFiles: formData.getAll('files').length,
      content: formData.get('content')
    });
    
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
        onUploadProgress,
        timeout: 60000
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Create post error:', error);
      throw error.response?.data || error;
    }
  },
  
  // ✅ 4. LIKE POST - FIXED with reaction type
  likePost: (postId, reactionType = 'like') => 
    API.post(`/posts/${postId}/like`, { reactionType }),
  
  // ✅ 5. Add comment
  addComment: (postId, text) => 
    API.post('/posts/comment', { postId, text }),
  
  // ✅ 6. DELETE POST - FIXED
  deletePost: (postId) => 
    API.delete(`/posts/${postId}`),
  
  // ✅ 7. DELETE COMMENT - CRITICAL ADDITION
  deleteComment: (postId, commentId) => 
    API.delete(`/posts/${postId}/comment/${commentId}`),
  
  // ✅ 8. Get user posts
  getUserPosts: (userId, page = 1, limit = 10) => 
    API.get(`/posts/user/${userId}`, { params: { page, limit } }),
  
  // ✅ 9. For backward compatibility
  getFeed: (params) => API.get("/posts", { params }),
  
  // ✅ 10. reactPost - For reactions
  reactPost: (postId, type) => API.post(`/posts/${postId}/react`, { type }),
  
  // ✅ 11. commentPost - Alternative comment function
  commentPost: (postId, text) => API.post(`/posts/${postId}/comment`, { text })
};

// ✅ AUTH API
export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  testConnection: () => API.get('/auth/test-connection'),
  logout: () => API.post('/auth/logout'),
};

// ✅ Export individual functions for backward compatibility
export const createPost = (data) => API.post("/posts", data);
export const getFeed = (params) => API.get("/posts", { params });
export const reactPost = (postId, type) => API.post(`/posts/${postId}/react`, { type });
export const commentPost = (postId, text) => API.post(`/posts/${postId}/comment`, { text });
export const deleteComment = (postId, commentId) => API.delete(`/posts/${postId}/comment/${commentId}`);
export const getPosts = (page = 1, limit = 100) => API.get("/posts", { params: { page, limit } });

export default API;