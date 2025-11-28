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
  getUserProfile 
} from "../controllers/userController.js";
import requireAuth from "../middleware/authMiddleware.js";

const router = express.Router();

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
 * UPDATE USER PROFILE (ONBOARDING COMPLETION)
 */
router.put("/profile", requireAuth, 
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

export default router;