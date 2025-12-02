// src/services/posts.js
import API from "./api";

export const createPost = (data) => API.post("/posts", data);
export const getFeed = (params) => API.get("/posts", { params });
export const reactPost = (postId, type) => API.post(`/posts/${postId}/react`, { type });
export const commentPost = (postId, text) => API.post(`/posts/${postId}/comment`, { text });
export const getUserPosts = async (userId) => {
  try {
    const response = await API.get(`/posts/user/${userId}`);
    return response;
  } catch (error) {
    console.error("Get user posts error:", error);
    throw error;
  }
};