// Test notification creation directly
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createNotificationSafely } from './utils/notificationHelper.js';
import User from './models/User.js';
import Post from './models/Post.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trendzz';

async function testNotificationCreation() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    // Get two users
    const users = await User.find().limit(2).select('_id name username');
    
    if (users.length < 2) {
      console.log('❌ Need at least 2 users in database');
      process.exit(1);
    }

    const sender = users[0];
    const recipient = users[1];

    console.log(`👤 Sender: ${sender.name} (${sender._id})`);
    console.log(`👤 Recipient: ${recipient.name} (${recipient._id})\n`);

    // Get a post
    const post = await Post.findOne().select('_id');
    
    if (!post) {
      console.log('❌ No posts found in database');
      process.exit(1);
    }

    console.log(`📄 Post ID: ${post._id}\n`);

    // Test 1: Create LIKE notification
    console.log('=== TEST 1: Create LIKE notification ===');
    try {
      const likeNotif = await createNotificationSafely({
        recipientId: recipient._id,
        senderId: sender._id,
        type: 'like',
        postId: post._id,
        io: null // No socket for this test
      });
      console.log('✅ Like notification created:', likeNotif._id);
    } catch (error) {
      console.error('❌ Like notification failed:', error.message);
    }

    // Test 2: Create COMMENT notification
    console.log('\n=== TEST 2: Create COMMENT notification ===');
    try {
      const commentNotif = await createNotificationSafely({
        recipientId: recipient._id,
        senderId: sender._id,
        type: 'comment',
        postId: post._id,
        io: null,
        data: { commentText: 'Test comment' }
      });
      console.log('✅ Comment notification created:', commentNotif._id);
    } catch (error) {
      console.error('❌ Comment notification failed:', error.message);
    }

    // Test 3: Create ADMIRED notification
    console.log('\n=== TEST 3: Create ADMIRED notification ===');
    try {
      const admiredNotif = await createNotificationSafely({
        recipientId: recipient._id,
        senderId: sender._id,
        type: 'admired',
        io: null
      });
      console.log('✅ Admired notification created:', admiredNotif._id);
    } catch (error) {
      console.error('❌ Admired notification failed:', error.message);
    }

    // Test 4: Create MENTION notification
    console.log('\n=== TEST 4: Create MENTION notification ===');
    try {
      const mentionNotif = await createNotificationSafely({
        recipientId: recipient._id,
        senderId: sender._id,
        type: 'mention',
        postId: post._id,
        io: null
      });
      console.log('✅ Mention notification created:', mentionNotif._id);
    } catch (error) {
      console.error('❌ Mention notification failed:', error.message);
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testNotificationCreation();
