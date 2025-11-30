import express from "express";
import User from "../models/User.js";
import requireAuth from "../middleware/authMiddleware.js";
import { 
  updatePrivacySettings, 
  debugPrivacySettings, 
  updateUserPrivacy,
  getFollowingList,    // ADDED
  getFollowersList     // ADDED
} from "../controllers/userController.js";

const router = express.Router();
// Add these routes
router.get('/following/:userId', requireAuth, getFollowingList);
router.get('/followers/:userId', requireAuth, getFollowersList);
router.put('/update-privacy', requireAuth, updatePrivacySettings);
router.get('/debug-privacy', requireAuth, debugPrivacySettings);
// Alternative privacy route
router.put('/privacy', requireAuth, updateUserPrivacy);

// Test route to check if privacy endpoint works
router.get('/test-privacy', requireAuth, (req, res) => {
  res.json({ 
    success: true, 
    message: "Privacy endpoint is working!",
    user: req.user.id 
  });
});

// Search users
router.get("/search", requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    
    console.log("🔍 Search query received:", q);

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: "Search query must be at least 2 characters" 
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
    .select("name username avatar role semester batch followers following")
    .limit(20)
    .lean();

    console.log("✅ Users found:", users.length);

    const formattedUsers = users.map(user => {
      let followersCount = 0;
      if (user.followers && Array.isArray(user.followers)) {
        followersCount = user.followers.length;
      }

      let followingCount = 0;
      if (user.following && Array.isArray(user.following)) {
        followingCount = user.following.length;
      }

      return {
        _id: user._id,
        name: user.name || 'Unknown User',
        username: user.username || 'No username',
        avatar: user.avatar || '',
        role: user.role || 'user',
        semester: user.semester || '',
        batch: user.batch || '',
        followersCount: followersCount,
        followingCount: followingCount
      };
    });

    res.json({
      success: true,
      data: formattedUsers
    });

  } catch (error) {
    console.error("❌ Search users error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during search" 
    });
  }
});

// Get user profile by ID - FIXED BLOCK CHECK
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
        const followerIds = user.followers.map(f => 
          typeof f === 'object' && f.$oid ? f.$oid : f
        );
        followers = await User.find({ _id: { $in: followerIds } })
          .select('name username avatar role semester batch')
          .lean();
      }

      // Get following details  
      if (user.following && user.following.length > 0) {
        const followingIds = user.following.map(f => 
          typeof f === 'object' && f.$oid ? f.$oid : f
        );
        following = await User.find({ _id: { $in: followingIds } })
          .select('name username avatar role semester batch')
          .lean();
      }

      // Get admirers details
      if (user.admirers && user.admirers.length > 0) {
        const admirerIds = user.admirers.map(a => 
          typeof a === 'object' && a.$oid ? a.$oid : a
        );
        admirers = await User.find({ _id: { $in: admirerIds } })
          .select('name username avatar')
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
      isFollowing: isFollowing,
      hasAdmired: hasAdmired,
      followersCount: followers.length,
      followingCount: following.length,
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

// DEBUG: Test profile update
router.put("/test-update", requireAuth, async (req, res) => {
  try {
    console.log("🔵 TEST - Request body:", req.body);
    console.log("🔵 TEST - User ID:", req.user.id);
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: req.body.name,
        username: req.body.username,
        bio: req.body.bio,
        role: req.body.role,
        semester: req.body.semester,
        batch: req.body.batch
      },
      { new: true }
    );

    console.log("✅ TEST - Updated user:", updatedUser);

    res.json({
      success: true,
      message: "Test update successful",
      user: updatedUser
    });

  } catch (error) {
    console.error("❌ TEST - Error:", error);
    res.status(500).json({ success: false, message: error.message });
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

    // Get updated target user with populated followers
    const updatedTargetUser = await User.findById(targetUserId)
      .populate('followers', 'name username avatar');

    res.json({
      success: true,
      isFollowing: !isFollowing,
      followersCount: updatedTargetUser.followers.length,
      followers: updatedTargetUser.followers
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

// Block user - FIXED VERSION
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

// UNBLOCK USER - ADD THIS MISSING ENDPOINT
// UNBLOCK USER - ENHANCED WITH DEBUG LOGGING
router.post("/unblock/:userId", requireAuth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    console.log("🔓 Unblock request - User:", currentUserId, "Unblocking:", targetUserId);
    console.log("🔓 Request params:", req.params);
    console.log("🔓 Current user ID from auth:", req.user._id);

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
    console.log("🔓 Current user blockedUsers:", currentUser.blockedUsers);
    console.log("🔓 Looking for targetUserId in blockedUsers:", targetUserId);
    
    if (!currentUser.blockedUsers || !currentUser.blockedUsers.includes(targetUserId)) {
      console.log("❌ User is not in blocked list");
      return res.status(400).json({
        success: false,
        message: "User is not blocked"
      });
    }

    // Remove from blocked users
    const updatedUser = await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { blockedUsers: targetUserId } },
      { new: true }
    );

    console.log("✅ User unblocked successfully");
    console.log("✅ Updated blockedUsers:", updatedUser.blockedUsers);

    res.json({
      success: true,
      message: "User unblocked successfully"
    });

  } catch (error) {
    console.error("❌ Unblock user error:", error);
    console.error("❌ Error details:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while unblocking user: " + error.message
    });
  }
});
// Add this temporary debug route to test routing
router.get("/debug-test", requireAuth, (req, res) => {
  res.json({ 
    success: true, 
    message: "User routes are working",
    currentTime: new Date().toISOString()
  });
});

// DEBUG: Get all users for testing
router.get("/debug/all-users", requireAuth, async (req, res) => {
  try {
    const allUsers = await User.find({})
      .select("name username email role semester batch createdAt blockedUsers")
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

// Get suggested users for onboarding
router.get("/suggested-users", requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    const suggestedUsers = await User.find({
      _id: { $ne: currentUserId },
      firstLogin: false
    })
    .select("name username avatar role semester batch followers")
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

export default router;