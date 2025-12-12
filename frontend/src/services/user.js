// src/services/user.js - COMPLETE FIXED VERSION
import API from "./api";

// ✅ NO /api prefix (already in baseURL)
export const getUserProfile = (userId) => API.get(`/users/profile/${userId}`);
export const getCurrentUserProfile = () => API.get('/auth/profile');

export const updateProfile = (formData) => 
  API.put('/auth/profile-with-images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

export const uploadImage = (formData) => 
  API.post('/auth/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

export const getSuggestedUsers = () => API.get("/suggestions/strict");
export const searchUsers = (query) => API.get(`/users/search?q=${encodeURIComponent(query)}`);
export const blockUser = (userId) => API.post(`/users/block/${userId}`);
export const unblockUser = (userId) => API.post(`/users/unblock/${userId}`);
export const followUser = (userId) => API.post(`/users/follow/${userId}`);
export const admireUser = (userId) => API.post(`/users/admire/${userId}`);
export const debugAllUsers = () => API.get('/users/debug/all-users');