// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chat.js";
import setupSocket from "./socket/socket.js";
import path from "path";
import { fileURLToPath } from 'url';

dotenv.config();
connectDB();

const app = express();
const server = createServer(app);

// ✅ __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Socket.io
const io = setupSocket(server);

// CORS Configuration
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Body parsing with larger limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Serve static files from uploads directory (optional)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);  // ✅ Post routes should be before userRoutes if they have similar patterns
app.use("/api/users", userRoutes);
app.use("/api", chatRoutes);   // ✅ Better to prefix with /api/chat

// ✅ Home Route
app.get("/", (req, res) => {
  res.json({ 
    message: '🚀 TRENDZZ Server is running!',
    version: '1.0.0',
    cloudinary: {
      configured: !!process.env.CLOUDINARY_CLOUD_NAME,
      folder: 'social-media-posts'  // ✅ Changed from 'instagram-posts'
    },
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      posts: {
        createPost: 'POST /api/posts (multipart/form-data)',
        getAllPosts: 'GET /api/posts',
        getUserPosts: 'GET /api/posts/user/:userId',
        likePost: 'POST /api/posts/like',
        addComment: 'POST /api/posts/comment',
        deletePost: 'DELETE /api/posts/:id'
      },
      users: 'Various endpoints under /api/users',
      chat: 'Socket.io + REST endpoints under /api/chat'
    }
  });
});

// ✅ Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "Connected",
      cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? "Configured" : "Not configured",
      websocket: "Active"
    }
  });
});

// ✅ Test route for file upload (optional but helpful)
app.get("/api/test-upload", (req, res) => {
  res.json({
    message: "Upload endpoint is ready",
    maxFileSize: "50MB",
    allowedTypes: "Images and Videos",
    endpoint: "POST /api/posts"
  });
});

// ✅ 404 Error Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  // Handle multer errors (file upload errors)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }
  
  // Handle other errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🎯 Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🏠 Home: http://localhost:${PORT}/`);
  console.log(`☁️ Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configured ✅' : 'Not configured ❌'}`);
  console.log(`🔄 WebSocket: Active on /socket.io`);
  console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
});

export { io };