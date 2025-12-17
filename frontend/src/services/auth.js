import API from "./api";

// ✅ FIXED: Interceptor now returns response.data directly
export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);
export const verifyEmail = (token) => API.get(`/auth/verify-email?token=${token}`);
export const resendVerification = (email) => API.post("/auth/resend-verification", { email });

// auth.js - Simplified updateProfile (interceptor returns data directly)
export const updateProfile = async (userData) => {
  try {
    console.log("🔵 [auth.js] updateProfile called with:", userData);
    
    const response = await API.put('/auth/profile-original', userData);
    
    console.log("🟢 [auth.js] Response:", response);
    
    // Interceptor now returns response.data directly
    return response;
    
  } catch (error) {
    console.error("🔴 [auth.js] updateProfile error:", error);
    
    // Return error in consistent format
    const errorObj = {
      success: false,
      message: error.message || "Update failed",
      error: error
    };
    
    throw errorObj;
  }
};

export const getProfile = () => API.get("/auth/profile").then(res => res.data || res);