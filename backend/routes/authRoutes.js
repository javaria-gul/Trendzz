import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { body, validationResult } from "express-validator";
import xss from "xss";
import { 
  registerUser, 
  loginUser, 
  updateUserProfile,
  getUserProfile,
  updateUserProfileWithImages,
  uploadProfileImage,
  upload
} from "../controllers/userController.js";
import requireAuth from "../middleware/authMiddleware.js";

const router = express.Router();




/**
 * ✅ DEBUG ROUTES - TEST CONNECTION
 */
// Test if auth routes are accessible
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth routes are working!",
    path: "/api/auth/test"
  });
});

// Test protected route
router.get("/test-protected", requireAuth, (req, res) => {
  res.json({
    success: true,
    message: "Protected auth route is working!",
    user: {
      id: req.user._id,
      email: req.user.email
    }
  });
});

// Test the exact profile-original route with GET
router.get("/profile-original", requireAuth, (req, res) => {
  res.json({
    success: true,
    message: "GET /profile-original is working!",
    user: req.user
  });
});

/**
 * ✅ PROFILE ORIGINAL ROUTE - PUT (THIS WAS MISSING!)
 */

// Simple test PUT route
router.put("/test-put", requireAuth, (req, res) => {
  console.log("✅ PUT /test-put route working!");
  res.json({
    success: true,
    message: "PUT route is working!",
    receivedData: req.body
  });
});

router.put("/profile-original", requireAuth, 
  [
    body("username")
      .optional()
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be 3-20 characters")
      .matches(/^[a-zA-Z0-9_ ]+$/)
      .withMessage("Username can only contain letters, numbers, underscores and spaces"),
    body("role")
      .optional()
      .isIn(["student", "faculty"])
      .withMessage("Role must be either student or faculty"),
  ],
  async (req, res) => {
    try {
      console.log("🔵 PROFILE-ORIGINAL - Request received:", req.body);
      console.log("🔵 PROFILE-ORIGINAL - User ID:", req.user._id);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          message: errors.array()[0].msg 
        });
      }

      // Update user directly
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          username: req.body.username,
          name: req.body.name || req.body.username,
          avatar: req.body.avatar,
          role: req.body.role,
          semester: req.body.semester,
          batch: req.body.batch,
          subjects: req.body.subjects || [],
          bio: req.body.bio || `Hey! I'm ${req.body.username} on Trendzz!`,
          firstLogin: false
        },
        { new: true }
      ).select("-password");

      console.log("✅ PROFILE-ORIGINAL - User updated successfully:", updatedUser);

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser
      });

    } catch (error) {
      console.error("❌ PROFILE-ORIGINAL - Error:", error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Username already taken"
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Server error: " + error.message
      });
    }
  }
);

// Separate image upload endpoint (optional)
router.post('/upload-image', requireAuth, upload.single('image'), uploadProfileImage);

/**
 * REGISTER ROUTE
 */
router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Name must be 3-30 characters long")
      .customSanitizer((value) => xss(value)),
    body("email")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail()
      .customSanitizer((value) => xss(value)),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .customSanitizer((value) => xss(value)),
  ],
  registerUser
);

/**
 * LOGIN ROUTE
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  loginUser
);

/**
 * UPDATE USER PROFILE (ONBOARDING COMPLETION) - TEXT ONLY
 */
router.put("/profile-text", requireAuth, 
  [
    body("username")
      .optional()
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be 3-20 characters")
      .matches(/^[a-zA-Z0-9_ ]+$/)
      .withMessage("Username can only contain letters, numbers, underscores and spaces"),
    body("role")
      .optional()
      .isIn(["student", "faculty"])
      .withMessage("Role must be either student or faculty"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: errors.array()[0].msg 
      });
    }

    await updateUserProfile(req, res);
  }
);

/**
 * GET USER PROFILE
 */
router.get("/profile", requireAuth, getUserProfile);

// Temporary debug route
router.get("/debug/test", requireAuth, (req, res) => {
  res.json({
    success: true,
    message: "Backend is working",
    user: req.user
  });
});

// Add this to authRoutes.js for testing
router.get("/test-connection", requireAuth, (req, res) => {
  res.json({
    success: true,
    message: "Auth routes are working!",
    user: {
      id: req.user._id,
      email: req.user.email
    }
  });
});

export default router;