// src/services/api.js (UPDATED VERSION)
import axios from "axios";

const BASE_URL = "http://localhost:5000"; 

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
});

// ✅ FIXED: Request interceptor - better handling for multipart/form-data
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("trendzz_token");
  
  // Always add Authorization header if token exists
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Don't overwrite Content-Type if it's multipart/form-data
  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  
  console.log('📡 API Request:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    contentType: config.headers['Content-Type']
  });
  
  return config;
}, (error) => {
  console.error('❌ Request interceptor error:', error);
  return Promise.reject(error);
});

// ✅ FIXED: Response interceptor
// api.js - Line 40-45 ko update karo
API.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    
    // ✅ IMPORTANT: Return the FULL response, not just response.data
    // Kyonki postsAPI ko access chahiye headers and other info
    return response; // ← CHANGE THIS LINE
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      response: error.response?.data
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem("trendzz_token");
      window.location.href = "/login";
    }
    
    // ✅ Return consistent error format
    return Promise.reject({
      success: false,
      message: error.response?.data?.message || error.message || 'Network error',
      error: error
    });
  }
);

// ✅ POSTS API with better debugging
export const postsAPI = {
  // Create post with media
// api.js - postsAPI.createPost function
createPost: async (formData, onUploadProgress) => {
  console.log('📤 Creating post with formData:', {
    hasFiles: formData.getAll('files').length,
    content: formData.get('content'),
    location: formData.get('location')
  });
  
  try {
    const token = localStorage.getItem("trendzz_token");
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // ✅ Use axios directly with proper config
    const response = await axios.post(`${BASE_URL}/api/posts`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      onUploadProgress
    });
    
    console.log('✅ Post created response:', response.data);
    return response.data; // ← Return just the data
    
  } catch (error) {
    console.error('❌ Create post error:', error);
    throw error.response?.data || error;
  }
},
  
  // Get all posts
  getPosts: (page = 1, limit = 10) => 
    API.get('/posts', { params: { page, limit } }),
  
  // Get user's posts
  getUserPosts: (userId, page = 1, limit = 10) => 
    API.get(`/posts/user/${userId}`, { params: { page, limit } }),
  
  // Toggle like
  likePost: (postId) => 
    API.post('/posts/like', { postId }),
  
  // Add comment
  addComment: (postId, text) => 
    API.post('/posts/comment', { postId, text }),
  
  // Delete post
  deletePost: (postId) => 
    API.delete(`/posts/${postId}`),
};

// ✅ AUTH API
export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  testConnection: () => API.get('/auth/test-connection'),
  logout: () => API.post('/auth/logout'),
};

export default API;