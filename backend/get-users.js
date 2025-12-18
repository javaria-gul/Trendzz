import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function getUsers() {
  try {
    console.log('MongoDB URI:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const users = await User.find().limit(2).select('_id name username email');
    console.log('\n=== FIRST 2 USERS IN DATABASE ===');
    users.forEach((u, i) => {
      console.log(`User ${i + 1}: ID=${u._id}, Name=${u.name}, Username=${u.username}`);
    });
    
    if (users.length >= 2) {
      console.log(`\n✅ Found 2 users. Use these IDs for testing:`);
      console.log(`  USER_A_ID=${users[0]._id}`);
      console.log(`  USER_B_ID=${users[1]._id}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

getUsers();
