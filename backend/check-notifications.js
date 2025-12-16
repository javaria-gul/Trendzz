import mongoose from 'mongoose';
import Notification from './models/Notification.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkNotifications() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all notifications
    const allNotifications = await Notification.find()
      .populate('recipient', '_id name username')
      .populate('sender', '_id name username')
      .limit(10);

    console.log('📋 ALL NOTIFICATIONS IN DATABASE:');
    console.log(`Total: ${await Notification.countDocuments()}\n`);
    
    allNotifications.forEach((n, i) => {
      console.log(`${i + 1}. Type: ${n.type}`);
      console.log(`   Recipient: ${n.recipient?.name} (${n.recipient?._id})`);
      console.log(`   Sender: ${n.sender?.name} (${n.sender?._id})`);
      console.log(`   Read: ${n.read}`);
      console.log(`   Created: ${n.createdAt}\n`);
    });

    // Get unread count for each user
    console.log('📊 UNREAD COUNTS BY USER:');
    const users = await Notification.distinct('recipient');
    for (const userId of users) {
      const count = await Notification.countDocuments({ recipient: userId, read: false });
      const user = await User.findById(userId).select('name');
      console.log(`${user?.name}: ${count} unread`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkNotifications();
