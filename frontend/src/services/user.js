// frontend/src/services/user.js

import API from "./api";

// Search users - PROPER ERROR HANDLING
export const searchUsers = async (query) => {
  try {
    const response = await API.get(`/users/search?q=${encodeURIComponent(query)}`);
    
    // Check if response has proper structure
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

// Get user profile by ID
export const getUserProfile = (userId) => API.get(`/users/profile/${userId}`);

// Follow/Unfollow user
export const followUser = (userId) => API.post(`/users/${userId}/follow`);

// Admire user
export const admireUser = (userId) => API.post(`/users/${userId}/admire`);

// Block user
export const blockUser = (userId) => API.post(`/users/${userId}/block`);
// Get suggested users for onboarding
export const getSuggestedUsers = () => API.get("/users/suggested-users");

export const debugAllUsers = () => API.get('/users/debug/all-users');
export const debugProfileCheck = () => API.get('/users/debug/profile-check');
