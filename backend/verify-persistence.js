// Quick Backend Verification Script
// Run with: node backend/verify-persistence.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
import Post from './models/Post.js';
import User from './models/User.js';
import Notification from './models/Notification.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trendzz';

async function verifyPersistence() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check Posts with likes
    console.log('📊 POSTS WITH LIKES:');
    const postsWithLikes = await Post.find({ likes: { $exists: true, $ne: [] } })
      .select('content likes likesCount')
      .populate('user', 'name username')
      .lean()
      .limit(5);
    
    if (postsWithLikes.length > 0) {
      postsWithLikes.forEach((post, i) => {
        console.log(`${i + 1}. Post by ${post.user?.name || 'Unknown'}`);
        console.log(`   Likes: ${post.likes?.length || 0} (count: ${post.likesCount || 0})`);
        console.log(`   Content: "${(post.content || '').substring(0, 50)}..."\n`);
      });
    } else {
      console.log('   ⚠️ No posts with likes found\n');
    }

    // Check Posts with comments
    console.log('💬 POSTS WITH COMMENTS:');
    const postsWithComments = await Post.find({ comments: { $exists: true, $ne: [] } })
      .select('content comments commentsCount')
      .populate('user', 'name username')
      .populate('comments.user', 'name username')
      .lean()
      .limit(5);
    
    if (postsWithComments.length > 0) {
      postsWithComments.forEach((post, i) => {
        console.log(`${i + 1}. Post by ${post.user?.name || 'Unknown'}`);
        console.log(`   Comments: ${post.comments?.length || 0} (count: ${post.commentsCount || 0})`);
        if (post.comments && post.comments.length > 0) {
          console.log(`   Latest: "${(post.comments[post.comments.length - 1]?.text || '').substring(0, 50)}..."`);
          console.log(`   By: ${post.comments[post.comments.length - 1]?.user?.name || 'Unknown'}`);
        }
        console.log('');
      });
    } else {
      console.log('   ⚠️ No posts with comments found\n');
    }

    // Check Users with admirers
    console.log('⭐ USERS WITH ADMIRERS:');
    const usersWithAdmirers = await User.find({ admirers: { $exists: true, $ne: [] } })
      .select('name username admirers admirersCount')
      .lean()
      .limit(5);
    
    if (usersWithAdmirers.length > 0) {
      usersWithAdmirers.forEach((user, i) => {
        console.log(`${i + 1}. ${user.name} (@${user.username})`);
        console.log(`   Admirers: ${user.admirers?.length || 0} (count: ${user.admirersCount || 0})\n`);
      });
    } else {
      console.log('   ⚠️ No users with admirers found\n');
    }

    // Check Notifications
    console.log('🔔 RECENT NOTIFICATIONS (Last 10):');
    const recentNotifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('sender', 'name username')
      .populate('recipient', 'name username')
      .lean();
    
    if (recentNotifications.length > 0) {
      recentNotifications.forEach((notif, i) => {
        console.log(`${i + 1}. ${notif.type.toUpperCase()}`);
        console.log(`   From: ${notif.sender?.name || 'Unknown'}`);
        console.log(`   To: ${notif.recipient?.name || 'Unknown'}`);
        console.log(`   Read: ${notif.read ? '✅' : '❌'}`);
        console.log(`   Created: ${new Date(notif.createdAt).toLocaleString()}\n`);
      });
    } else {
      console.log('   ⚠️ No notifications found\n');
    }

    // Summary
    console.log('\n📈 SUMMARY:');
    const totalPosts = await Post.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalNotifications = await Notification.countDocuments();
    const unreadNotifications = await Notification.countDocuments({ read: false });

    console.log(`Total Posts: ${totalPosts}`);
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Total Notifications: ${totalNotifications}`);
    console.log(`Unread Notifications: ${unreadNotifications}`);

    // Notification type breakdown
    console.log('\n📊 NOTIFICATION TYPES:');
    const types = ['like', 'comment', 'mention', 'follow', 'message', 'admired'];
    for (const type of types) {
      const count = await Notification.countDocuments({ type });
      console.log(`${type}: ${count}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

verifyPersistence();
