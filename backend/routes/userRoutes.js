import express from "express";
import User from "../models/User.js";
import requireAuth from "../middleware/authMiddleware.js";

const router = express.Router();

// Search users - FIXED VERSION
router.get("/search", requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    
    console.log("🔍 Search query received:", q);

    if (!q || q.trim().length < 2) {
      return res.json({ 
        success: true,
        data: [] 
      });
    }

    const searchQuery = q.trim();
    
    const users = await User.find({
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { username: { $regex: searchQuery, $options: "i" } }
      ],
      _id: { $ne: req.user._id }
    })
    .select("name username avatar role onlineStatus")
    .limit(20)
    .lean();

    console.log("✅ Users found:", users.length);

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error("❌ Search users error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during search" 
    });
  }
});

// Get user profile by ID
router.get("/profile/:userId", requireAuth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    console.log("🔍 Fetching profile for:", targetUserId, "by user:", currentUserId);
    
    // Check if current user has blocked this user
    const currentUser = await User.findById(currentUserId);
    if (currentUser.blockedUsers && currentUser.blockedUsers.includes(targetUserId)) {
      console.log("🚫 User is blocked, returning limited profile");
      const blockedUser = await User.findById(targetUserId)
        .select("name username avatar coverImage")
        .lean();
      
      return res.json({
        success: true,
        data: {
          ...blockedUser,
          isBlocked: true
        }
      });
    }

    const user = await User.findById(targetUserId)
      .select("-password -emailVerificationToken -emailVerificationExpires");

    if (!user) {
      console.log("❌ User not found:", targetUserId);
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    console.log("✅ User found:", user.name);

    // MANUAL POPULATION
    let followers = [];
    let following = [];
    let admirers = [];

    try {
      // Get followers details
      if (user.followers && user.followers.length > 0) {
        followers = await User.find({ _id: { $in: user.followers } })
          .select('name username avatar role')
          .limit(10)
          .lean();
      }

      // Get following details  
      if (user.following && user.following.length > 0) {
        following = await User.find({ _id: { $in: user.following } })
          .select('name username avatar role')
          .limit(10)
          .lean();
      }

      // Get admirers details
      if (user.admirers && user.admirers.length > 0) {
        admirers = await User.find({ _id: { $in: user.admirers } })
          .select('name username avatar')
          .limit(10)
          .lean();
      }
    } catch (populateError) {
      console.error("Population error:", populateError);
    }

    // Check if current user is following this user
    const isFollowing = currentUser.following && currentUser.following.includes(targetUserId);

    // Check if current user has admired this user
    const hasAdmired = user.admirers && user.admirers.includes(currentUserId);

    console.log("📊 Profile stats - Following:", isFollowing, "Admired:", hasAdmired);

    // Build response
    const responseData = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.privacySettings?.showEmail ? user.email : undefined,
      bio: user.bio || '',
      avatar: user.avatar,
      coverImage: user.coverImage,
      role: user.role,
      semester: user.semester,
      batch: user.batch,
      subjects: user.subjects || [],
      followers: user.privacySettings?.showFollowers ? followers : [],
      following: user.privacySettings?.showFollowing ? following : [],
      admirers: admirers,
      admirersCount: user.admirersCount || 0,
      privacySettings: user.privacySettings,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen,
      onlineStatus: user.onlineStatus || 'offline',
      isFollowing: isFollowing,
      hasAdmired: hasAdmired,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      postsCount: user.postsCount || 0,
      isBlocked: false
    };

    console.log("📤 Sending profile data for:", user.name);
    
    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error("❌ Get user profile error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error: " + error.message 
    });
  }
});

// Follow/Unfollow user
router.post("/follow/:userId", requireAuth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    console.log("🔄 Follow action - Current user:", currentUserId, "Target:", targetUserId);

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself"
      });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isFollowing = targetUser.followers.includes(currentUserId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId }
      });
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId }
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: currentUserId }
      });
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: targetUserId }
      });
    }

    // Get updated counts
    const updatedTargetUser = await User.findById(targetUserId);
    const updatedCurrentUser = await User.findById(currentUserId);

    res.json({
      success: true,
      isFollowing: !isFollowing,
      followersCount: updatedTargetUser.followers.length,
      followingCount: updatedCurrentUser.following.length
    });

  } catch (error) {
    console.error("Follow user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Admire/Unadmire user
router.post("/admire/:userId", requireAuth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot admire yourself"
      });
    }

    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const hasAdmired = targetUser.admirers.includes(currentUserId);

    if (hasAdmired) {
      // Unadmire
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { admirers: currentUserId },
        $inc: { admirersCount: -1 }
      });
    } else {
      // Admire
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { admirers: currentUserId },
        $inc: { admirersCount: 1 }
      });
    }

    const updatedTargetUser = await User.findById(targetUserId);

    res.json({
      success: true,
      hasAdmired: !hasAdmired,
      admirersCount: updatedTargetUser.admirersCount
    });

  } catch (error) {
    console.error("Admire user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Block user
router.post("/block/:userId", requireAuth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    console.log("🚫 Block request - User:", currentUserId, "Blocking:", targetUserId);

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot block yourself"
      });
    }

    // Check if user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if already blocked
    const currentUser = await User.findById(currentUserId);
    if (currentUser.blockedUsers && currentUser.blockedUsers.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "User is already blocked"
      });
    }

    // Add to blocked users and remove from followers/following
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: targetUserId },
      $pull: { 
        followers: targetUserId,
        following: targetUserId
      }
    });

    // Remove current user from target user's followers/following
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { 
        followers: currentUserId,
        following: currentUserId
      }
    });

    console.log("✅ User blocked successfully");

    res.json({
      success: true,
      message: "User blocked successfully"
    });

  } catch (error) {
    console.error("❌ Block user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while blocking user"
    });
  }
});

// Unblock user
router.post("/unblock/:userId", requireAuth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    console.log("🔓 Unblock request - User:", currentUserId, "Unblocking:", targetUserId);

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot unblock yourself"
      });
    }

    // Check if user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      console.log("❌ Target user not found:", targetUserId);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is actually blocked
    const currentUser = await User.findById(currentUserId);
    if (!currentUser.blockedUsers || !currentUser.blockedUsers.includes(targetUserId)) {
      console.log("❌ User is not in blocked list");
      return res.status(400).json({
        success: false,
        message: "User is not blocked"
      });
    }

    // Remove from blocked users
    await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { blockedUsers: targetUserId } },
      { new: true }
    );

    console.log("✅ User unblocked successfully");

    res.json({
      success: true,
      message: "User unblocked successfully"
    });

  } catch (error) {
    console.error("❌ Unblock user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while unblocking user: " + error.message
    });
  }
});

// Get suggested users for onboarding
router.get("/suggested-users", requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    const suggestedUsers = await User.find({
      _id: { $ne: currentUserId },
      firstLogin: false
    })
    .select("name username avatar role semester batch followers onlineStatus")
    .limit(8)
    .lean();

    const usersWithCounts = suggestedUsers.map(user => ({
      ...user,
      followersCount: user.followers?.length || 0
    }));

    res.json({
      success: true,
      data: usersWithCounts
    });

  } catch (error) {
    console.error("Get suggested users error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Debug route
router.get("/debug/all-users", requireAuth, async (req, res) => {
  try {
    const allUsers = await User.find({})
      .select("name username email role semester batch createdAt blockedUsers onlineStatus avatar")
      .lean();
    
    console.log("Total users in database:", allUsers.length);

    res.json({
      success: true,
      totalUsers: allUsers.length,
      users: allUsers
    });

  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ 
      success: false,
      message: "Debug error" 
    });
  }
});

export default router;