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

// Update privacy settings
export const updatePrivacySettings = (privacySettings) => 
  API.put('/users/update-privacy', { privacySettings });

// ML-based suggested users for onboarding
export const getSuggestedUsers = () => API.get("/suggestions/strict");

// Search users function with error handling
export const searchUsers = async (query) => {
  try {
    const response = await API.get(`/users/search?q=${encodeURIComponent(query)}`);
    if (response.data && response.data.success) {
      return response;
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("Search API error:", error);
    throw error;
  }
};

// Get following list
export const getFollowingList = async (userId) => {
  try {
    const response = await API.get(`/users/following/${userId}`);
    return response;
  } catch (error) {
    console.error("Get following list error:", error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await API.get(`/users/simple/${userId}`);
    return response;
  } catch (error) {
    console.error("Get user by ID error:", error);
    throw error;
  }
};

// Get followers list
export const getFollowersList = async (userId) => {
  try {
    const response = await API.get(`/users/followers/${userId}`);
    return response;
  } catch (error) {
    console.error("Get followers list error:", error);
    throw error;
  }
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

// ML Recommendations API call
export const getMLRecommendations = async () => {
  try {
    const response = await API.get('/users/recommendations');
    return response.data;
  } catch (error) {
    console.error('Error fetching ML recommendations:', error);
    throw error;
  }
};

// Get all users
export const getAllUsers = async () => {
  try {
    const response = await API.get('/users/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

// Test ML recommendations
export const testMLRecommendations = async () => {
  try {
    console.log('Testing ML recommendations...');
    const token = localStorage.getItem('trendzz_token');
    console.log('Token exists:', !!token);
    
    const response = await API.get('/users/recommendations');
    console.log('ML Test Response:', response);
    return response.data;
  } catch (error) {
    console.error('ML Test Error:', error.response?.data || error.message);
    throw error;
  }
};
