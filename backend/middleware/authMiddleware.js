// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader?.startsWith("Bearer ")) {
      // Only log if it's not a common public route
      if (!req.path.includes('/socket.io')) {
        console.log("⚠️ Auth required - No token provided for:", req.method, req.path);
      }
      return res.status(401).json({ 
        success: false,
        message: "No authentication token, access denied" 
      });
    }
    
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ Master Prompt expects 'userId' field
    const userId = payload.userId || payload.id;
    
    // Fetch full user from database
    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      console.log("❌ User not found in database:", userId);
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    // ✅ Attach both user and userId (Master Prompt uses both)
    req.user = user;
    req.userId = user._id;  // ✅ Master Prompt expects req.userId
    
    next();
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Token is invalid or expired"  // ✅ Master Prompt message
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token is invalid or expired" 
      });
    }
    
    return res.status(401).json({ 
      success: false,  // ✅ Master Prompt format
      message: "Token is invalid or expired",
      error: err.message 
    });
  }
};

export default requireAuth;