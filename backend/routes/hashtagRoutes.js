// backend/routes/hashtagRoutes.js
import express from "express";
import {
  getPostsByHashtag,
  getTrendingHashtags,
  searchHashtags,
  getHashtagStats
} from "../controllers/hashtagController.js";
import requireAuth from "../middleware/authMiddleware.js";

const router = express.Router();

// Get trending hashtags
router.get("/trending", requireAuth, getTrendingHashtags);

// Search hashtags (autocomplete)
router.get("/search", requireAuth, searchHashtags);

// Get posts by hashtag
router.get("/:hashtag/posts", requireAuth, getPostsByHashtag);

// Get hashtag stats
router.get("/:hashtag/stats", requireAuth, getHashtagStats);

export default router;
