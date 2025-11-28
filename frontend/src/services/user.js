import API from "./api";

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

// Add this to your existing user services
export const unblockUser = async (userId) => {
  try {
    const response = await API.put(`/users/unblock/${userId}`);
    return response;
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
};
// services/user.js

export const getUserProfile = (userId) => API.get(`/users/profile/${userId}`);
export const followUser = (userId) => API.post(`/users/follow/${userId}`);
export const admireUser = (userId) => API.post(`/users/admire/${userId}`);
export const blockUser = (userId) => API.post(`/users/block/${userId}`);
export const debugAllUsers = () => API.get('/users/debug/all-users');