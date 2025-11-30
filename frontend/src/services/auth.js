import API from "./api";

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

export const verifyEmail = (token) => API.get(`/auth/verify-email?token=${token}`);
export const resendVerification = (email) => API.post("/auth/resend-verification", { email });

export const updateProfile = async (userData) => {
  return await API.put('/auth/profile-original', userData);
};

// ✅ NEW: Get user profile
export const getProfile = () => API.get("/auth/profile");