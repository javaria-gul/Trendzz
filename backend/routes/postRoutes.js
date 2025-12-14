// backend/routes/postRoutes.js - COMPLETE FIXED VERSION
import express from "express";
import { 
  createPost, 
  getFeed,  
  deletePost,
  getUserPosts,
  toggleLike,
  addComment,
  deleteComment,  
  debugCheckPosts  
} from "../controllers/postController.js";
import requireAuth from "../middleware/authMiddleware.js"; // ✅ CHANGE: authMiddleware → requireAuth
import upload from "../middleware/uploadMiddleware.js";


const router = express.Router();

// ✅ 1. Create post with media
router.post("/", requireAuth, upload.array('files', 10), createPost);

// ✅ 2. Get all posts (feed)
router.get("/", requireAuth, getFeed);

// ✅ 3. Add comment (CRITICAL FIX) - FIXED ROUTE
router.post("/comment", requireAuth, addComment);

// ✅ 4. Toggle like with reaction
router.post("/:postId/like", requireAuth, toggleLike);

// ✅ 5. Delete comment
router.delete("/:postId/comment/:commentId", requireAuth, deleteComment);

// ✅ 6. Delete post
router.delete("/:id", requireAuth, deletePost);

// ✅ 7. Get user posts
router.get("/user/:userId", requireAuth, getUserPosts);

// ✅ 8. Debug route
router.get("/debug/check", requireAuth, debugCheckPosts);

export default router;