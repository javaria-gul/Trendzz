// backend/test-cloudinary.js
import dotenv from 'dotenv';
dotenv.config();

import cloudinary from './config/cloudinary.js';

console.log('Testing Cloudinary credentials...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set (hidden)' : 'Missing');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set (hidden)' : 'Missing');

// Test upload
const testUpload = async () => {
  try {
    const result = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      { folder: 'test' }
    );
    console.log('✅ Cloudinary test PASSED:', result.secure_url);
  } catch (error) {
    console.error('❌ Cloudinary test FAILED:', error.message);
  }
};

testUpload();