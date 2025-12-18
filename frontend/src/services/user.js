// src/services/user.js - COMPLETE FIXED VERSION
import API from "./api";
import axios from 'axios';


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

// // ML Recommendations API call
// export const getMLRecommendations = async () => {
//   try {
//     const response = await API.get('/users/recommendations');
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching ML recommendations:', error);
//     throw error;
//   }
// };
// Add this function to your existing user service
// ✅ FIXED: ML Recommendations API call

// ✅ REAL ML RECOMMENDATIONS - NO DEMO DATA
// ✅ FIXED: ML Recommendations API call with proper authentication
export const getMLRecommendations = async () => {
    try {
        console.log('📡 [ML] Fetching recommendations...');
        
        // Get token for debugging
        const token = localStorage.getItem('trendzz_token');
        console.log('🔑 [ML] Token exists:', !!token);
        if (token) {
            console.log('🔑 [ML] Token first 20 chars:', token.substring(0, 20) + '...');
        }
        
        // Make API call with proper headers
        const response = await API.get('/ml/recommendations', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 [ML] Response:', {
            success: response.data.success,
            count: response.data.data?.length || 0,
            message: response.data.message
        });
        
        // If no data or error, return empty array
        if (!response.data.success || !response.data.data) {
            return {
                success: false,
                data: [],
                message: response.data.message || "No recommendations available"
            };
        }
        
        return response.data;
        
    } catch (error) {
        console.error('❌ [ML] Error fetching recommendations:', error);
        
        // Check error response
        if (error.response) {
            console.error('📊 [ML] Error response:', error.response.data);
            console.error('📊 [ML] Error status:', error.response.status);
            
            if (error.response.status === 401) {
                console.error('🔑 [ML] Authentication failed - Token invalid');
                return {
                    success: false,
                    data: [],
                    message: "Authentication failed. Please login again.",
                    error: "UNAUTHORIZED"
                };
            }
        }
        
        // Check if ML service is running
        try {
            console.log('🔍 [ML] Checking service health...');
            const healthCheck = await axios.get('http://localhost:8001/health', { timeout: 3000 });
            console.log('✅ [ML] Service health:', healthCheck.data);
            
            return {
                success: false,
                data: [],
                message: "ML service is running but no recommendations found.",
                ml_service_status: "running"
            };
        } catch (healthError) {
            console.log('❌ [ML] Service not reachable:', healthError.message);
            
            return {
                success: false,
                data: [],
                message: "ML service is not running. Please start the Python ML service.",
                ml_service_status: "stopped",
                solution: "Run: python ml-recommender/simple_ml_service.py"
            };
        }
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

