// src/services/posts.js (COMPLETE FIXED VERSION)
import API from "./api";

// ✅ Master prompt ke according updated APIs
export const postsAPI = {
  // Get all posts (paginated)
  getAllPosts: (page = 1, limit = 100) => 
    API.get("/posts", { params: { page, limit } }),
  
  // Create post with media (multipart/form-data)
  createPost: (formData, onUploadProgress) => 
    API.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    }),
  
  // ✅ FIXED: Like/Unlike post
  likePost: (postId, reactionType = 'like') => 
    API.post(`/posts/${postId}/like`, { reactionType }),
  
  // Add comment
  addComment: (postId, text) => 
    API.post('/posts/comment', { postId, text }),
  
  // ✅ FIXED: Delete post
  deletePost: (postId) => 
    API.delete(`/posts/${postId}`),
  
  // ✅ ADDED: Delete comment
  deleteComment: (postId, commentId) => 
    API.delete(`/posts/${postId}/comment/${commentId}`),
  
  // Get posts by specific user
  getUserPosts: (userId, page = 1, limit = 10) => 
    API.get(`/posts/user/${userId}`, { params: { page, limit } }),
  
  // For backward compatibility
  getFeed: (params) => API.get("/posts", { params }),
  reactPost: (postId, type) => API.post(`/posts/${postId}/react`, { type }),
  commentPost: (postId, text) => API.post(`/posts/${postId}/comment`, { text })
};

// ✅ Export individual functions
export const createPost = (data) => API.post("/posts", data);
export const getFeed = (params) => API.get("/posts", { params });
export const reactPost = (postId, type) => API.post(`/posts/${postId}/react`, { type });
export const commentPost = (postId, text) => API.post(`/posts/${postId}/comment`, { text });
export const deleteComment = (postId, commentId) => API.delete(`/posts/${postId}/comment/${commentId}`);

export default postsAPI;