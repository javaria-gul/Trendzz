import API from "./api";

// Update profile with image upload
// Change to use the new endpoint
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

// Other functions remain same...
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

// Block user - FIXED ENDPOINT
export const blockUser = (userId) => API.post(`/users/block/${userId}`);

// FIX: Change unblockUser from PUT to POST to match backend
export const unblockUser = (userId) => API.post(`http://localhost:5000/api/users/unblock/${userId}`);
// services/user.js
export const getUserProfile = (userId) => API.get(`/users/profile/${userId}`);
export const followUser = (userId) => API.post(`/users/follow/${userId}`);
export const admireUser = (userId) => API.post(`/users/admire/${userId}`);
export const debugAllUsers = () => API.get('/users/debug/all-users');