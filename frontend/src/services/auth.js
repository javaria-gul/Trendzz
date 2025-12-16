import API from "./api";

// ✅ FIXED: These now return only the data part
export const register = async (data) => {
  try {
    const res = await API.post('/auth/register', data);
    return res.data || res;
  } catch (err) {
    console.error('auth.register error:', err);
    // Normalize network/CORS errors to a consistent Error object
    const message = err.response?.data?.message || err.message || 'Network error';
    const error = new Error(message);
    error.response = err.response;
    throw error;
  }
};

export const login = async (data) => {
  try {
    const res = await API.post('/auth/login', data);
    return res.data || res;
  } catch (err) {
    console.error('auth.login error:', err);
    const message = err.response?.data?.message || err.message || 'Network error';
    const error = new Error(message);
    error.response = err.response;
    throw error;
  }
};
export const verifyEmail = (token) => API.get(`/auth/verify-email?token=${token}`).then(res => res.data || res);
export const resendVerification = (email) => API.post("/auth/resend-verification", { email }).then(res => res.data || res);

// auth.js - COMPLETELY FIXED updateProfile function
// auth.js - Make sure updateProfile returns proper structure
export const updateProfile = async (userData) => {
  try {
    console.log("🔵 [auth.js] updateProfile called with:", userData);
    
    const response = await API.put('/auth/profile-original', userData);
    
    console.log("🟢 [auth.js] Raw response:", response);
    
    // ✅ IMPORTANT: Check if response has data property
    if (response && typeof response === 'object') {
      if (response.data !== undefined) {
        console.log("✅ [auth.js] Returning response.data");
        return response.data;
      } else {
        // If response is already the data
        console.log("✅ [auth.js] Returning response (already data)");
        return response;
      }
    }
    
    console.error("❌ [auth.js] Invalid response format");
    throw new Error("Invalid response format");
    
  } catch (error) {
    console.error("🔴 [auth.js] updateProfile error:", error);
    
    // Return error in consistent format
    const errorObj = {
      success: false,
      message: error.response?.data?.message || error.message || "Update failed",
      error: error
    };
    
    throw errorObj;
  }
};

export const getProfile = () => API.get("/auth/profile").then(res => res.data || res);