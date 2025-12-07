import API from "./api";

// ✅ Master prompt ke according updated APIs
export const postsAPI = {
  // Get all posts (paginated)
  getAllPosts: (page = 1, limit = 10) => 
    API.get("/posts", { params: { page, limit } }),
  
  // Create post with media (multipart/form-data)
  createPost: (formData, onUploadProgress) => 
    API.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    }),
  
  // Like/Unlike post (master prompt ka format)
  likePost: (postId) => 
    API.post('/posts/like', { postId }),
  
  // Add comment (master prompt ka format)
  addComment: (postId, text) => 
    API.post('/posts/comment', { postId, text }),
  
  // Delete post
  deletePost: (postId) => 
    API.delete(`/posts/${postId}`),
  
  // Get posts by specific user
  getUserPosts: (userId, page = 1, limit = 10) => 
    API.get(`/posts/user/${userId}`, { params: { page, limit } }),
  
  // ✅ For backward compatibility with existing code
  getFeed: (params) => API.get("/posts", { params }),
  reactPost: (postId, type) => API.post(`/posts/${postId}/react`, { type }),
  commentPost: (postId, text) => API.post(`/posts/${postId}/comment`, { text })
};

// ✅ Export individual functions for backward compatibility
export const createPost = (data) => API.post("/posts", data);
export const getFeed = (params) => API.get("/posts", { params });
export const reactPost = (postId, type) => API.post(`/posts/${postId}/react`, { type });
export const commentPost = (postId, text) => API.post(`/posts/${postId}/comment`, { text });

export default postsAPI;