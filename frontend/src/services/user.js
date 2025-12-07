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

// Update privacy settings
export const updatePrivacySettings = (privacySettings) => 
  API.put('/users/update-privacy', { privacySettings });

// ML-based suggested users for onboarding
export const getSuggestedUsers = () => API.get("/suggestions/strict");

// Search users function
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

// Block user
export const blockUser = (userId) => API.post(`/users/block/${userId}`);

// Unblock user - FIXED: Use API, not direct axios
export const unblockUser = (userId) => API.post(`/users/unblock/${userId}`);

// Other user functions
export const getUserProfile = (userId) => API.get(`/users/profile/${userId}`);
export const followUser = (userId) => API.post(`/users/follow/${userId}`);
export const admireUser = (userId) => API.post(`/users/admire/${userId}`);
export const debugAllUsers = () => API.get('/users/debug/all-users');

// ✅ FIXED: ML Recommendations API call - Using existing API instance
export const getMLRecommendations = async () => {
  try {
    const response = await API.get('/users/recommendations');
    return response.data;
  } catch (error) {
    console.error('Error fetching ML recommendations:', error);
    throw error;
  }
};

// ✅ FIXED: Get all users - Using existing API instance
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