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
  upload // ✅ Use the existing upload from controller
} from "../controllers/userController.js";
import requireAuth from "../middleware/authMiddleware.js";
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Cloudinary helper function
const uploadToCloudinary = async (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `social-media/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto' },
          { format: 'webp' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    
    uploadStream.end(fileBuffer);
  });
};

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
 * ✅ PROFILE WITH IMAGES UPLOAD ROUTE
 */
router.put("/profile-with-images", requireAuth, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log("🎯 PROFILE-WITH-IMAGES - Request received");
    console.log("📦 Request body:", req.body);
    console.log("📸 Files received:", req.files);

    const {
      name,
      username,
      bio,
      role,
      semester,
      batch,
      subjects
    } = req.body;

    const userId = req.user._id;

    // Prepare update data
    const updateData = {
      name,
      username,
      bio,
      role,
      semester,
      batch,
      subjects: subjects ? JSON.parse(subjects) : []
    };

    console.log("📦 Initial update data:", updateData);

    // Handle avatar upload
    if (req.files && req.files.avatar) {
      try {
        console.log("📸 Uploading avatar to Cloudinary...");
        const avatarResult = await uploadToCloudinary(req.files.avatar[0].buffer, 'avatars');
        updateData.avatar = avatarResult.secure_url;
        console.log("✅ Avatar uploaded:", avatarResult.secure_url);
      } catch (avatarError) {
        console.error("❌ Avatar upload failed:", avatarError);
        return res.status(400).json({
          success: false,
          message: "Failed to upload avatar image"
        });
      }
    }

    // Handle cover image upload
    if (req.files && req.files.coverImage) {
      try {
        console.log("📸 Uploading cover image to Cloudinary...");
        const coverResult = await uploadToCloudinary(req.files.coverImage[0].buffer, 'covers');
        updateData.coverImage = coverResult.secure_url;
        console.log("✅ Cover image uploaded:", coverResult.secure_url);
      } catch (coverError) {
        console.error("❌ Cover image upload failed:", coverError);
        return res.status(400).json({
          success: false,
          message: "Failed to upload cover image"
        });
      }
    }

    console.log("📦 Final update data with images:", updateData);

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    console.log("✅ USER UPDATED SUCCESSFULLY:", updatedUser.username);

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("❌ Profile with images update error:", error);
    
    if (error.code === 11000 && error.keyPattern.username) {
      return res.status(400).json({ 
        success: false,
        message: "Username already taken. Please choose another one." 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error during profile update: " + error.message 
    });
  }
});

/**
 * ✅ PROFILE ORIGINAL ROUTE - PUT
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