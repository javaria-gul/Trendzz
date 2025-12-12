import API from "./api";

// Update profile with image upload
export const updateProfile = (formData) => API.put('/auth/profile-with-images', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Upload image only
export const uploadImage = (formData) => API.post('/auth/upload-image', formData, {
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

// Get user profile by ID
export const getUserProfile = (userId) => API.get(`/users/profile/${userId}`);

// Follow/Unfollow user
export const followUser = (userId) => API.post(`/users/follow/${userId}`);

// Admire/Unadmire user
export const admireUser = (userId) => API.post(`/users/admire/${userId}`);

// Block user
export const blockUser = (userId) => API.post(`/users/block/${userId}`);

// Unblock user - FIXED: Correct endpoint
export const unblockUser = (userId) => API.post(`/users/unblock/${userId}`);

// Debug function to get all users
export const debugAllUsers = () => API.get('/users/debug/all-users');

// Get suggested users for chat
export const getChatSuggestedUsers = () => API.get('/users/suggested-users');