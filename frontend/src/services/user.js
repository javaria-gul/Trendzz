// src/services/user.js - COMPLETE FIXED VERSION
import API from "./api";

// Get current user profile
export const getCurrentUserProfile = () => API.get('/auth/profile');

// Get user profile by ID
export const getUserProfile = (userId) => API.get(`/users/profile/${userId}`);

// Update profile with image upload
export const updateProfile = (formData) => 
  API.put('/auth/profile-with-images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

// Upload image only
export const uploadImage = (formData) => 
  API.post('/auth/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

// ML-based suggested users for onboarding
export const getSuggestedUsers = () => API.get("/suggestions/strict");

// Search users - FIXED: Simple and clean
export const searchUsers = (query) => {
  return API.get(`/users/search?q=${encodeURIComponent(query)}`);
};

// Follow user
export const followUser = (userId) => API.post(`/users/follow/${userId}`);

// Admire user
export const admireUser = (userId) => API.post(`/users/admire/${userId}`);

// Block user
export const blockUser = (userId) => API.post(`/users/block/${userId}`);

// Unblock user
export const unblockUser = (userId) => API.post(`/users/unblock/${userId}`);

// Debug function to get all users
export const debugAllUsers = () => API.get('/users/debug/all-users');

// Get suggested users for chat
export const getChatSuggestedUsers = () => API.get('/users/suggested-users');

// Unfollow user (agar backend me hai to)
// export const unfollowUser = (userId) => API.delete(`/users/follow/${userId}`);