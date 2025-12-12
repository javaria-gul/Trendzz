// backend/config/cloudinary.js
import pkg from 'cloudinary';
const { v2: cloudinary } = pkg;
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Cloudinary Config Check:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dl07wiajg',
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ NOT FOUND',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ NOT FOUND'
});

// Configure Cloudinary with timeout for large files
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dl07wiajg',
  api_key: process.env.CLOUDINARY_API_KEY || '512269274451677',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'YaygY5xgJ-0_2YPo9pDKjKUnMMY',
  secure: true,
  timeout: 120000, // 120 seconds timeout for large files
  chunk_size: 20000000, // 20MB chunk size for large files
});

// ✅ UPLOAD FUNCTION WITH LARGE FILE SUPPORT
export const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`📤 Uploading file to Cloudinary, buffer size: ${fileBuffer.length} bytes`);
    
    // Set a timeout
    const timeout = setTimeout(() => {
      reject(new Error('Cloudinary upload timeout (60 seconds)'));
    }, 60000);
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'social-media-posts',
        resource_type: 'auto',
        timeout: 60000, // 60 seconds
        chunk_size: 20000000, // 20MB chunks
        ...options
      },
      (error, result) => {
        clearTimeout(timeout);
        if (error) {
          console.error('❌ Cloudinary upload error:', {
            message: error.message,
            http_code: error.http_code,
            name: error.name
          });
          reject(error);
        } else {
          console.log('✅ Cloudinary upload success:', {
            url: result.secure_url,
            type: result.resource_type,
            size: result.bytes
          });
          resolve(result);
        }
      }
    );
    
    const stream = Readable.from(fileBuffer);
    stream.pipe(uploadStream);
  });
};

// ✅ ALTERNATIVE: For VERY large files (>100MB)
export const uploadLargeToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Using large file upload, size: ${fileBuffer.length} bytes`);
    
    // For very large files, we might need a different approach
    const uploadStream = cloudinary.uploader.upload_large(fileBuffer, 
      {
        folder: 'social-media-posts',
        resource_type: 'auto',
        chunk_size: 20000000, // 20MB chunks
        ...options
      },
      (error, result) => {
        if (error) {
          console.error('❌ Large upload error:', error.message);
          reject(error);
        } else {
          console.log('✅ Large upload success');
          resolve(result);
        }
      }
    );
  });
};

export default cloudinary;