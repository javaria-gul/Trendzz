import express from "express";
import User from "../models/User.js";
import requireAuth from "../middleware/authMiddleware.js";

const router = express.Router();

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

// Get user profile by ID
router.get("/profile/:userId", requireAuth, async (req, res) => {
  try {
    console.log("🔍 Fetching profile for:", req.params.userId);
    
    const user = await User.findById(req.params.userId)
      .select("-password -emailVerificationToken -emailVerificationExpires");

    if (!user) {
      console.log("❌ User not found:", req.params.userId);
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
    const isFollowing = followers.some(follower => 
      follower._id.toString() === req.user._id.toString()
    );

    // Check if current user has admired this user
    const hasAdmired = admirers.some(admirer => 
      admirer._id.toString() === req.user._id.toString()
    );

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
      isFollowing: isFollowing,
      hasAdmired: hasAdmired,
      followersCount: followers.length,
      followingCount: following.length
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

// Block user
router.post("/block/:userId", requireAuth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot block yourself"
      });
    }

    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: targetUserId }
    });

    res.json({
      success: true,
      message: "User blocked successfully"
    });

  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// DEBUG: Get all users for testing
router.get("/debug/all-users", requireAuth, async (req, res) => {
  try {
    const allUsers = await User.find({})
      .select("name username email role semester batch createdAt")
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