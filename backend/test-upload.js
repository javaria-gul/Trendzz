// backend/test-upload.js
import { uploadToCloudinary } from './config/cloudinary.js';

// Create a small test buffer
const testBuffer = Buffer.from('test');
const testUpload = async () => {
  try {
    console.log('Testing Cloudinary upload...');
    const result = await uploadToCloudinary(testBuffer, {
      folder: 'test',
      public_id: 'test-file'
    });
    console.log('✅ Test upload successful:', result.secure_url);
  } catch (error) {
    console.error('❌ Test upload failed:', error.message);
  }
};

testUpload();