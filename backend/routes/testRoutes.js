// Manual test endpoint to trigger like/comment/admire with notifications
import express from 'express';
const router = express.Router();

import auth from '../middleware/authMiddleware.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { createNotificationSafely } from '../utils/notificationHelper.js';

// Test endpoint: POST /api/test/like/:postId
router.post('/like/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    console.log('\n========== MANUAL LIKE TEST ==========');
    console.log('Post ID:', postId);
    console.log('User ID:', userId);
    console.log('Has io:', !!req.io);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    console.log('Post found. Owner:', post.user);

    // Add like
    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      await post.save();
      console.log('✅ Like added and saved');

      // Create notification
      console.log('Creating notification...');
      const notif = await createNotificationSafely({
        recipientId: post.user,
        senderId: userId,
        type: 'like',
        postId,
        io: req.io
      });
      console.log('✅ Notification created:', notif._id);
    }

    res.json({
      success: true,
      message: 'Like test successful',
      likes: post.likes.length
    });

  } catch (error) {
    console.error('❌ Test like error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint: POST /api/test/comment/:postId
router.post('/comment/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    console.log('\n========== MANUAL COMMENT TEST ==========');
    console.log('Post ID:', postId);
    console.log('User ID:', userId);
    console.log('Text:', text);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = {
      user: userId,
      text: text || 'Test comment',
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();
    console.log('✅ Comment added and saved');

    // Create notification
    const notif = await createNotificationSafely({
      recipientId: post.user,
      senderId: userId,
      type: 'comment',
      postId,
      io: req.io,
      data: { commentText: text }
    });
    console.log('✅ Notification created:', notif._id);

    res.json({
      success: true,
      message: 'Comment test successful',
      comments: post.comments.length
    });

  } catch (error) {
    console.error('❌ Test comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint: POST /api/test/admire/:userId
router.post('/admire/:userId', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    console.log('\n========== MANUAL ADMIRE TEST ==========');
    console.log('Target User ID:', targetUserId);
    console.log('Current User ID:', currentUserId);

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!targetUser.admirers) {
      targetUser.admirers = [];
    }

    if (!targetUser.admirers.includes(currentUserId)) {
      targetUser.admirers.push(currentUserId);
      targetUser.admirersCount = (targetUser.admirersCount || 0) + 1;
      await targetUser.save();
      console.log('✅ Admiration added and saved');

      // Create notification
      const notif = await createNotificationSafely({
        recipientId: targetUserId,
        senderId: currentUserId,
        type: 'admired',
        io: req.io
      });
      console.log('✅ Notification created:', notif._id);
    }

    res.json({
      success: true,
      message: 'Admire test successful',
      admirersCount: targetUser.admirersCount
    });

  } catch (error) {
    console.error('❌ Test admire error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
