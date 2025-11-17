import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    console.log("🔐 Auth Middleware - Checking token...");
    
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ No Bearer token found");
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized: token missing" 
      });
    }
    
    const token = authHeader.split(" ")[1];
    console.log("✅ Token extracted");
    
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded - User ID:", payload.id);
    
    // ✅ FIX: Fetch full user from database and attach to req.user
    const user = await User.findById(payload.id).select("-password");
    
    if (!user) {
      console.log("❌ User not found in database");
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    // ✅ FIX: Attach full user object (not just {id: ...})
    req.user = user;
    console.log("✅ User attached to request - ID:", user._id, "Name:", user.name);
    
    next();
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token expired" 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: "Unauthorized", 
      error: err.message 
    });
  }
};

export default requireAuth;