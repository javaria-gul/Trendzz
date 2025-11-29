import API from "./api";

export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);
export const verifyEmail = (token) => API.get(`/auth/verify-email?token=${token}`);
export const resendVerification = (email) => API.post("/auth/resend-verification", { email });

export const updateProfile = async (userData) => {
  return await API.put('/auth/profile-original', userData);
};

// ✅ NEW: Get user profile
export const getProfile = () => API.get("/auth/profile");