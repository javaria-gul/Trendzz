import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.status(201).json({ 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      token 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
      
      res.json({ 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        firstLogin: user.firstLogin,
        token 
      });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ NEW: Update User Profile (Onboarding Completion)
export const updateUserProfile = async (req, res) => {
  try {
    const { 
      username, 
      avatar, 
      role, 
      semester, 
      batch, 
      subjects,
      following,
      name,        // ✅ ADD THIS - name field
      bio,         // ✅ ADD THIS - bio field
      coverImage   // ✅ ADD THIS - coverImage field
    } = req.body;

    const userId = req.user.id;

    console.log("🟢 UPDATING ALL FIELDS:", { 
      userId, 
      name,        // ✅ LOG NAME
      username, 
      bio,         // ✅ LOG BIO
      role, 
      semester,
      batch,
      coverImage   // ✅ LOG COVER IMAGE
    });

    // ✅ Validate that followed users exist
    if (following && following.length > 0) {
      const existingUsers = await User.find({
        _id: { $in: following }
      }).select('_id');
      
      const existingUserIds = existingUsers.map(user => user._id.toString());
      const invalidUsers = following.filter(id => !existingUserIds.includes(id));
      
      if (invalidUsers.length > 0) {
        return res.status(400).json({ 
          success: false,
          message: `Invalid users selected: ${invalidUsers.join(', ')}` 
        });
      }
    }

    // ✅ Find user and update - ALL FIELDS INCLUDED
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name,        // ✅ ADD THIS
        username,
        bio,         // ✅ ADD THIS  
        avatar,
        coverImage,  // ✅ ADD THIS
        role,
        semester, 
        batch,
        subjects,
        following: following || [],
        firstLogin: false
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    console.log("✅ USER UPDATED SUCCESSFULLY:", {
      name: updatedUser.name,
      username: updatedUser.username,
      bio: updatedUser.bio,
      role: updatedUser.role
    });

    // ✅ Update followers count for followed users
    if (following && following.length > 0) {
      await User.updateMany(
        { _id: { $in: following } },
        { $addToSet: { followers: userId } }
      );
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("❌ Update profile error:", error);
    
    if (error.code === 11000 && error.keyPattern.username) {
      return res.status(400).json({ 
        success: false,
        message: "Username already taken. Please choose another one." 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error during profile update" 
    });
  }
};

// ✅ NEW: Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -emailVerificationToken -emailVerificationExpires');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};


// Debug endpoint to check all users
export const debugAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('name username email role semester batch firstLogin avatar bio')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error("Debug users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

// Add to userController.js
export const debugProfileCheck = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('name username email role semester batch firstLogin avatar bio following followers');
    
    res.json({
      success: true,
      user: user,
      message: `Onboarding completed: ${!user.firstLogin}`
    });
  } catch (error) {
    console.error("Debug profile error:", error);
    res.status(500).json({
      success: false,
      message: "Debug failed"
    });
  }
};
