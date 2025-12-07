import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import requireAuth from "../middleware/authMiddleware.js";
import { 
  updatePrivacySettings, 
  debugPrivacySettings, 
  updateUserPrivacy,
  getFollowingList,
  getFollowersList
} from "../controllers/userController.js";

const router = express.Router();

// In userRoutes.js - UPDATE the /recommendations route with improved logic:

router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    console.log("🧠 ML Recommendations requested by user:", currentUserId);

    // Get current user with following list
    const currentUser = await User.findById(currentUserId)
      .select('name role batch semester department interests skills following');
    
    if (!currentUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log("👤 Current user:", currentUser.name, "Role:", currentUser.role);

    // Get users not already followed and not blocked
    const allUsers = await User.find({ 
      _id: { $ne: currentUserId },
      _id: { $nin: currentUser.following || [] },

    })
    .select('name username avatar batch semester department role interests skills')
    .limit(100); // Limit for performance

    console.log("📊 Potential users for recommendations:", allUsers.length);

    // Enhanced ML Algorithm
    const getMLSuggestions = (users, currentUser) => {
      const getUserFeatures = (user) => {
        return {
          batch: user.batch || '',
          semester: user.semester || 0,
          department: user.department || '',
          role: user.role || 'student',
          interests: user.interests || [],
          skills: user.skills || []
        };
      };

      const currentUserFeatures = getUserFeatures(currentUser);
      
      const calculateSimilarity = (user1Features, user2Features) => {
        let score = 0;
        let maxScore = 0;

        // 1. Batch matching - HIGH PRIORITY
        if (user1Features.batch && user2Features.batch) {
          if (user1Features.batch === user2Features.batch) {
            score += 40;
            maxScore += 40;
          }
        }

        // 2. Semester matching - HIGH PRIORITY
        if (user1Features.semester && user2Features.semester) {
          const semesterDiff = Math.abs(user1Features.semester - user2Features.semester);
          if (semesterDiff === 0) {
            score += 30;
          } else if (semesterDiff === 1) {
            score += 20;
          } else if (semesterDiff === 2) {
            score += 10;
          }
          maxScore += 30;
        }

        // 3. Department matching - MEDIUM PRIORITY
        if (user1Features.department && user2Features.department) {
          if (user1Features.department === user2Features.department) {
            score += 15;
          }
          maxScore += 15;
        }

        // 4. Role-based logic
        if (currentUser.role === 'student') {
          // Students see more students
          if (user2Features.role === 'student') {
            score += 10;
          }
          maxScore += 10;
        } else if (currentUser.role === 'faculty') {
          // Faculty see more faculty
          if (user2Features.role === 'faculty') {
            score += 25;
          }
          maxScore += 25;
        }

        // 5. Interests matching
        if (user1Features.interests.length > 0 && user2Features.interests.length > 0) {
          const set1 = new Set(user1Features.interests.map(i => i.toLowerCase()));
          const set2 = new Set(user2Features.interests.map(i => i.toLowerCase()));
          const intersection = new Set([...set1].filter(x => set2.has(x)));
          const union = new Set([...set1, ...set2]);
          
          if (union.size > 0) {
            const jaccardScore = (intersection.size / union.size) * 15;
            score += jaccardScore;
          }
        }
        maxScore += 15;

        return maxScore > 0 ? (score / maxScore) * 100 : 0;
      };

      // Calculate scores for all users
      const usersWithScores = users.map(user => {
        const userFeatures = getUserFeatures(user);
        const similarityScore = calculateSimilarity(currentUserFeatures, userFeatures);
        
        return {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar || '/avatars/avatar1.png',
          batch: user.batch,
          semester: user.semester,
          department: user.department,
          role: user.role,
          similarityScore: Math.round(similarityScore * 10) / 10, // Round to 1 decimal
          reason: getRecommendationReason(currentUserFeatures, getUserFeatures(user), similarityScore)
        };
      });

      // Filter and sort
      return usersWithScores
        .filter(user => user.similarityScore > 25) // Lower threshold to show more
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 6); // Top 6
    };

    // Improved recommendation reason
    const getRecommendationReason = (currentUser, suggestedUser, score) => {
      const reasons = [];
      
      if (currentUser.batch === suggestedUser.batch && currentUser.batch) {
        reasons.push(`Batch ${currentUser.batch}`);
      }
      
      if (currentUser.semester === suggestedUser.semester && currentUser.semester) {
        reasons.push(`Semester ${currentUser.semester}`);
      }
      
      if (currentUser.department === suggestedUser.department && currentUser.department) {
        reasons.push(`${currentUser.department} Dept`);
      }
      
      if (currentUser.role === 'student' && suggestedUser.role === 'student') {
        reasons.push('Fellow Student');
      } else if (currentUser.role === 'faculty' && suggestedUser.role === 'faculty') {
        reasons.push('Faculty Colleague');
      }
      
      if (reasons.length > 0) {
        return reasons.join(' • ');
      }
      
      return score > 50 ? 'Similar interests' : 'You might know';
    };

    // Generate recommendations
    const recommendations = getMLSuggestions(allUsers, currentUser);

    console.log("🎯 ML Recommendations generated:", recommendations.length);

    res.status(200).json({
      success: true,
      data: recommendations,
      algorithm: "Enhanced Content-Based Filtering",
      weights: {
        batch: "40%",
        semester: "30%",
        department: "15%",
        role: currentUser.role === 'student' ? "10%" : "25%",
        interests: "15%"
      },
      threshold: "25% similarity",
      totalUsersConsidered: allUsers.length,
      recommendationsCount: recommendations.length,
      currentUser: {
        role: currentUser.role,
        batch: currentUser.batch,
        semester: currentUser.semester,
        department: currentUser.department
      }
    });

  } catch (error) {
    console.error('❌ ML Recommendation Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error in ML recommendations',
      error: error.message 
    });
  }
});

// ✅ FIXED: Get all users (for fallback)
router.get('/all', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    const users = await User.find({ 
      _id: { $ne: currentUserId },
    })
    .select('name username avatar batch semester department role interests skills')
    .limit(50)
    .lean();

    res.status(200).json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching users',
      error: error.message 
    });
  }
});

// Rest of your existing routes remain the same...
// Simple user details
router.get("/simple/:userId", requireAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const user = await User.findById(userId)
      .select("name username avatar bio role semester batch")
      .lean();
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    res.json({
      success: true,
      user: user
    });
    
  } catch (error) {
    console.error("Error fetching simple user details:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// Get following list
router.get('/following/:userId', requireAuth, getFollowingList);

// Get followers list
router.get('/followers/:userId', requireAuth, getFollowersList);

// Update privacy settings
router.put('/update-privacy', requireAuth, updatePrivacySettings);

// Debug privacy
router.get('/debug-privacy', requireAuth, debugPrivacySettings);

// Alternative privacy route
router.put('/privacy', requireAuth, updateUserPrivacy);

// Test privacy endpoint
router.get('/test-privacy', requireAuth, (req, res) => {
  res.json({ 
    success: true, 
    message: "Privacy endpoint is working!",
    user: req.user.id 
  });
});

// Email update
router.put("/update-email", requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user._id;

    console.log("📧 Email update request - User:", userId, "New email:", email);

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    const currentUser = await User.findById(userId);
    if (currentUser.email === email) {
      return res.status(400).json({
        success: false,
        message: "This is already your current email"
      });
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "This email is already in use by another account"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        email: email,
        isEmailVerified: false
      },
      { new: true }
    ).select("name email username avatar role semester batch privacySettings blockedUsers following followers createdAt updatedAt");

    console.log("✅ Email updated successfully for user:", updatedUser.name);

    res.json({
      success: true,
      message: "Email updated successfully. Please verify your new email.",
      user: updatedUser
    });

  } catch (error) {
    console.error("❌ Email update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating email: " + error.message
    });
  }
});

// Test email endpoint
router.put("/test-email", requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    console.log("🧪 TEST: Email update test");
    console.log("🧪 User ID:", req.user._id);
    console.log("🧪 Current email:", req.user.email);
    console.log("🧪 New email:", email);
    
    res.json({
      success: true,
      message: "Test endpoint works!",
      testData: {
        userId: req.user._id,
        currentEmail: req.user.email,
        newEmail: email,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Test error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
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

// Get user profile by ID
router.get("/profile/:userId", requireAuth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    console.log("🔍 Fetching profile for:", targetUserId, "by user:", currentUserId);
    
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

    const isFollowing = currentUser.following && currentUser.following.includes(targetUserId);
    const hasAdmired = user.admirers && user.admirers.includes(currentUserId);

    console.log("📊 Profile stats - Following:", isFollowing, "Admired:", hasAdmired);

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

// Test profile update
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

    console.log("🚫 Block request - User:", currentUserId, "Blocking:", targetUserId);

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot block yourself"
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const currentUser = await User.findById(currentUserId);
    if (currentUser.blockedUsers && currentUser.blockedUsers.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "User is already blocked"
      });
    }

    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: targetUserId },
      $pull: { 
        followers: targetUserId,
        following: targetUserId
      }
    });

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

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      console.log("❌ Target user not found:", targetUserId);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser.blockedUsers || !currentUser.blockedUsers.includes(targetUserId)) {
      console.log("❌ User is not in blocked list");
      return res.status(400).json({
        success: false,
        message: "User is not blocked"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
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

// Debug test route
router.get("/debug-test", requireAuth, (req, res) => {
  res.json({ 
    success: true, 
    message: "User routes are working",
    currentTime: new Date().toISOString()
  });
});

// Get all users for testing
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

// Change password
router.put("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    console.log("🔑 Password change request - User:", userId);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide both current and new password"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    console.log("✅ Password updated successfully for user:", user.name);

    res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (error) {
    console.error("❌ Password change error:", error);
    res.status(500).json({
      success: false,
      message: "Server error changing password: " + error.message
    });
  }
});

export default router;