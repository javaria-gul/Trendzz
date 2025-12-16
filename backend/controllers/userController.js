import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import cloudinary from '../config/cloudinary.js';
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload image to Cloudinary
const uploadToCloudinary = async (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `social-media/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' }, // Resize for optimization
          { quality: 'auto' },
          { format: 'webp' } // Convert to webp for better performance
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

// Update profile with image uploads
export const updateUserProfileWithImages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      name, username, bio, role, semester, batch, subjects 
    } = req.body;

    console.log("🟢 UPDATING PROFILE WITH IMAGES - User ID:", userId);
    console.log("📸 Files received:", req.files ? Object.keys(req.files) : 'No files');
    
    // Debug: Log all files details
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        console.log(`📁 ${key}:`, req.files[key][0]?.originalname);
      });
    }

    // Find user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Prepare update data
    const updateData = {
      name,
      username,
      bio,
      role,
      semester,
      batch,
      subjects: Array.isArray(subjects) ? subjects : [],
      firstLogin: false
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

    // Handle cover image upload - ADD EXTRA DEBUGGING
    if (req.files && req.files.coverImage) {
      try {
        console.log("📸 Uploading cover image to Cloudinary...");
        console.log("📁 Cover image file details:", {
          originalname: req.files.coverImage[0].originalname,
          size: req.files.coverImage[0].size,
          mimetype: req.files.coverImage[0].mimetype
        });
        
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
    } else {
      console.log("❌ No coverImage files found in request");
    }

    console.log("📦 Final update data with images:", updateData);

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    console.log("✅ USER UPDATED SUCCESSFULLY");
    console.log("📊 Updated user data:", {
      avatar: updatedUser.avatar,
      coverImage: updatedUser.coverImage,
      hasCoverImage: !!updatedUser.coverImage
    });

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

// Separate endpoint for image upload only (optional)
export const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.body; // 'avatar' or 'cover'

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided"
      });
    }

    const folder = type === 'cover' ? 'covers' : 'avatars';
    const uploadResult = await uploadToCloudinary(req.file.buffer, folder);

    // Update user with new image URL
    const updateField = type === 'cover' ? 'coverImage' : 'avatar';
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { [updateField]: uploadResult.secure_url },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: `${type} uploaded successfully`,
      imageUrl: uploadResult.secure_url,
      user: updatedUser
    });

  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image"
    });
  }
};

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword,
      blockedUsers: [] // Initialize empty blockedUsers array
    });

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

// userController.js - loginUser function mein yeh fix karein:

// userController.js - loginUser function ko original rakhein

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ Password automatically select hoga
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
      
      res.json({ 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        firstLogin: user.firstLogin,
        blockedUsers: user.blockedUsers || [],
        token 
      });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Get other user's profile - UPDATED TO INCLUDE PRIVACY SETTINGS
export const getOtherUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    console.log("🔍 Fetching profile for user:", userId, "by:", currentUserId);

    // Check if current user has blocked this user
    const currentUser = await User.findById(currentUserId);
    if (currentUser.blockedUsers && currentUser.blockedUsers.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You have blocked this user"
      });
    }

    // Get user WITH privacySettings
    const user = await User.findById(userId)
      .select('-password -emailVerificationToken -emailVerificationExpires')
      .populate('followers', 'name username avatar')
      .populate('following', 'name username avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Ensure privacySettings exist with default values
    const userWithPrivacy = {
      ...user.toObject(),
      privacySettings: user.privacySettings || {
        showEmail: true,
        showFollowers: true,
        showFollowing: true,
        allowMessages: true,
        showOnlineStatus: true
      }
    };

    // Check if current user is following this user
    const isFollowing = currentUser.following && currentUser.following.includes(userId);
    const hasAdmired = false;

    // Prepare response data
    const responseData = {
      _id: userWithPrivacy._id,
      name: userWithPrivacy.name,
      username: userWithPrivacy.username,
      email: userWithPrivacy.privacySettings?.showEmail ? userWithPrivacy.email : undefined,
      bio: userWithPrivacy.bio || '',
      avatar: userWithPrivacy.avatar,
      coverImage: userWithPrivacy.coverImage,
      role: userWithPrivacy.role,
      semester: userWithPrivacy.semester,
      batch: userWithPrivacy.batch,
      subjects: userWithPrivacy.subjects || [],
      followers: userWithPrivacy.privacySettings?.showFollowers ? userWithPrivacy.followers : [],
      following: userWithPrivacy.privacySettings?.showFollowing ? userWithPrivacy.following : [],
      admirers: userWithPrivacy.admirers || [],
      admirersCount: userWithPrivacy.admirersCount || 0,
      privacySettings: userWithPrivacy.privacySettings,
      createdAt: userWithPrivacy.createdAt,
      lastSeen: userWithPrivacy.lastSeen,
      isFollowing,
      hasAdmired,
      followersCount: userWithPrivacy.followers?.length || 0,
      followingCount: userWithPrivacy.following?.length || 0,
      postsCount: userWithPrivacy.postsCount || 0
    };

    console.log("📤 Sending profile data with privacy settings:", {
      name: responseData.name,
      allowMessages: responseData.privacySettings?.allowMessages
    });

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error("Get other user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user profile"
    });
  }
};

// ✅ Update User Profile (Onboarding Completion)
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
      name,
      bio,
      coverImage
    } = req.body;

    const userId = req.user.id;

    console.log("🟢 UPDATING ALL FIELDS:", { 
      userId, 
      name,
      username, 
      bio,
      role, 
      semester,
      batch,
      coverImage
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
        name,
        username,
        bio,
        avatar,
        coverImage,
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

// ✅ Get Current User Profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -emailVerificationToken -emailVerificationExpires')
      .populate('blockedUsers', 'name username avatar role'); // Populate with more fields

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

// Block user
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Prevent self-blocking
    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot block yourself"
      });
    }

    // Check if user exists
    const userToBlock = await User.findById(userId);
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if already blocked
    const currentUser = await User.findById(currentUserId);
    if (currentUser.blockedUsers && currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User is already blocked"
      });
    }

    // Add to blocked users
    const updatedUser = await User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { blockedUsers: userId } },
      { new: true }
    ).select('-password');

    // Remove from followers/following if they exist
    await User.findByIdAndUpdate(
      currentUserId,
      { 
        $pull: { 
          followers: userId,
          following: userId
        } 
      }
    );

    await User.findByIdAndUpdate(
      userId,
      { 
        $pull: { 
          followers: currentUserId,
          following: currentUserId
        } 
      }
    );

    res.json({
      success: true,
      message: "User blocked successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while blocking user"
    });
  }
};

// Unblock user
export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Check if user exists
    const userToUnblock = await User.findById(userId);
    if (!userToUnblock) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is actually blocked
    const currentUser = await User.findById(currentUserId);
    if (!currentUser.blockedUsers || !currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User is not blocked"
      });
    }

    // Remove from blocked users
    const updatedUser = await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { blockedUsers: userId } },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: "User unblocked successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while unblocking user"
    });
  }
};

// Debug endpoint to check all users
export const debugAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('name username email role semester batch firstLogin avatar bio blockedUsers')
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
      .select('name username email role semester batch firstLogin avatar bio following followers blockedUsers');
    
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

// Update privacy settings
export const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { privacySettings } = req.body;

    console.log("🛡️ Updating privacy settings for user:", userId);
    console.log("📋 New privacy settings:", privacySettings);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { privacySettings },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "Privacy settings updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Update privacy settings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating privacy settings"
    });
  }
};
// Alternative endpoint for privacy settings
export const updateUserPrivacy = async (req, res) => {
  try {
    const userId = req.user.id;
    const { privacySettings } = req.body;

    console.log("🛡️ UPDATING PRIVACY - User:", userId);
    console.log("📋 Privacy settings:", privacySettings);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { privacySettings },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: "Privacy settings updated",
      user: updatedUser
    });

  } catch (error) {
    console.error("Privacy update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update privacy settings"
    });
  }
};
// Debug: Check user's current privacy settings
export const debugPrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('privacySettings name email');
    
    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        privacySettings: user.privacySettings
      }
    });
  } catch (error) {
    console.error("Debug privacy error:", error);
    res.status(500).json({
      success: false,
      message: "Debug failed"
    });
  }
};
// Get detailed following list
export const getFollowingList = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('following', 'name username avatar bio role semester batch')
      .select('following');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      following: user.following || []
    });

  } catch (error) {
    console.error("Get following list error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching following list"
    });
  }
};

// Get detailed followers list
export const getFollowersList = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('followers', 'name username avatar bio role semester batch')
      .select('followers');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      followers: user.followers || []
    });

  } catch (error) {
    console.error("Get followers list error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching followers list"
    });
    
  }
  
};