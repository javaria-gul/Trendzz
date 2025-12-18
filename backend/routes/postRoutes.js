// postRoutes.js - SIRF YEH CODE RAKHO:

import express from "express";
import { 
  createPost, 
  getFeed,  
  addComment,
  deletePost,
  getUserPosts,
  toggleLike,
  addCommentNew,
  debugCheckPosts,
  addReaction,
  editComment,
  deleteComment,
  replyToComment
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
router.post("/:postId/like", auth, toggleLike);

// 4. POST /api/posts/comment - Add comment
router.post("/comment", auth, addCommentNew);

// 5. DELETE /api/posts/:id - Delete post
router.delete("/:id", auth, deletePost);

// 6. GET /api/posts/user/:userId - Get user posts
router.get("/user/:userId", getUserPosts);

// FOR BACKWARD COMPATIBILITY
router.post("/:id/comment", auth, addComment);

// Debug route
router.get("/debug/check", debugCheckPosts);

// New routes for reactions and enhanced comments
router.post("/:postId/reaction", auth, addReaction);
router.put("/:postId/comment/:commentId", auth, editComment);
router.delete("/:postId/comment/:commentId", auth, deleteComment);
router.post("/:postId/comment/:commentId/reply", auth, replyToComment);

// ✅ Simple test route
router.get("/test", (req, res) => {
  console.log("✅ /api/posts/test called");
  res.json({ 
    success: true, 
    message: "Posts API is working",
    timestamp: new Date().toISOString()
  });
});

export default router;