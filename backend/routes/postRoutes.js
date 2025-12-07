// postRoutes.js - SIRF YEH CODE RAKHO:

import express from "express";
import { 
  createPost, 
  getFeed, 
  addLike, 
  addComment,
  deletePost,
  getUserPosts,
  toggleLike,
  addCommentNew ,
   debugCheckPosts  
} from "../controllers/postController.js";
import upload from "../middleware/uploadMiddleware.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. POST /api/posts - Create post with media
router.post("/", 
  auth, 
  upload.array('files', 10), 
  createPost
);

// 2. GET /api/posts - Get all posts
router.get("/", getFeed);

// 3. POST /api/posts/like - Toggle like
router.post("/like", auth, toggleLike);

// 4. POST /api/posts/comment - Add comment
router.post("/comment", auth, addCommentNew);

// 5. DELETE /api/posts/:id - Delete post
router.delete("/:id", auth, deletePost);

// 6. GET /api/posts/user/:userId - Get user posts
router.get("/user/:userId", getUserPosts);

// FOR BACKWARD COMPATIBILITY
router.post("/:id/like", auth, addLike);
router.post("/:id/comment", auth, addComment);
// postRoutes.js mein
router.get("/debug/check", debugCheckPosts);

// ✅ Simple test route (ONLY THIS ADDITION)
router.get("/test", (req, res) => {
  console.log("✅ /api/posts/test called");
  res.json({ 
    success: true, 
    message: "Posts API is working",
    timestamp: new Date().toISOString()
  });
});

export default router;