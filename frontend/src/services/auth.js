import API from "./api";

// Register function with proper error handling
export const register = async (data) => {
  try {
    console.log('🟡 Sending register request:', data);
    const response = await API.post("/auth/register", data);
    console.log('🟢 Register response:', response.data);
    return response;
  } catch (error) {
    console.error('🔴 Register API error:', error.response?.data || error.message);
    throw error;
  }
};

// Login function with proper error handling
export const login = async (data) => {
  try {
    console.log('🟡 Sending login request:', data.email);
    const response = await API.post("/auth/login", data);
    console.log('🟢 Login response:', response.data);
    return response;
  } catch (error) {
    console.error('🔴 Login API error:', error.response?.data || error.message);
    throw error;
  }
};

// Verify email
export const verifyEmail = (token) => API.get(`/auth/verify-email?token=${token}`);

// Resend verification
export const resendVerification = (email) => API.post("/auth/resend-verification", { email });

// Update profile with proper error handling and consistent response format
export const updateProfile = async (userData) => {
  try {
    console.log("🔵 [auth.js] updateProfile called with:", userData);
    
    const response = await API.put('/auth/profile-original', userData);
    
    console.log("🟢 [auth.js] Raw response:", response);
    
    // Return the full response object for consistency
    return response;
    
  } catch (error) {
    console.error("🔴 [auth.js] updateProfile error:", error);
    throw error;
  }
};

// Get profile
export const getProfile = () => API.get("/auth/profile");