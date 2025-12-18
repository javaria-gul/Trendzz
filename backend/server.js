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
import notificationRoutes from './routes/notificationRoutes.js';
import testRoutes from './routes/testRoutes.js';


dotenv.config();
connectDB();

const app = express();
const server = createServer(app);
// Add this with other route imports by maria 
import mlRoutes from './routes/mlRoutes.js';

// ✅ __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Socket.io
const io = setupSocket(server);
  // Expose io on the app and attach to requests for controllers to use
  app.set('io', io);
  app.use((req, res, next) => {
    req.io = io;
    next();
  });
// Add this with other route uses by maria 
app.use('/api/ml', mlRoutes);


// CORS Configuration
// CORS: allow localhost origins during development (supports different dev ports)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server or curl requests
      try {
        const allowedLocal = /^(https?:\/\/localhost(:\d+)?|https?:\/\/127\.0\.0\.1(:\d+)?)$/i;
        if (process.env.NODE_ENV === 'development' && allowedLocal.test(origin)) {
          return callback(null, true);
        }
      } catch (e) {
        // fallback
      }
      // Fallback to configured FRONTEND_URL or default http://localhost:3000
      const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
      if (origin === frontend) return callback(null, true);
      return callback(new Error('CORS policy: This origin is not allowed'), false);
    },
    credentials: true,
  })
);
// Development convenience: allow all origins to ease local testing (will still require auth checks)
if (process.env.NODE_ENV === 'development') {
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
} else {
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        try {
          const allowedLocal = /^(https?:\/\/localhost(:\d+)?|https?:\/\/127\.0\.0\.1(:\d+)?)$/i;
          if (allowedLocal.test(origin)) return callback(null, true);
        } catch (e) {}
        const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
        if (origin === frontend) return callback(null, true);
        return callback(new Error('CORS policy: This origin is not allowed'), false);
      },
      credentials: true,
    })
  );
}

// --- DEBUG: Log every incoming request (method, url, headers) to diagnose network/CORS issues ---
app.use((req, res, next) => {
  try {
    console.log('REQUEST:', req.method, req.originalUrl);
    // Log only essential headers to avoid clutter
    const hdrs = {
      host: req.headers.host,
      origin: req.headers.origin,
      referer: req.headers.referer,
      'content-type': req.headers['content-type']
    };
    console.log('REQ HEADERS:', hdrs);
  } catch (e) {
    console.error('Request log error:', e);
  }
  next();
});

// Handle OPTIONS preflight explicitly and log it using middleware (avoids path-to-regexp '*' parsing issues)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    try {
      console.log('OPTIONS preflight for:', req.originalUrl, 'Headers:', {
        origin: req.headers.origin,
        'access-control-request-method': req.headers['access-control-request-method'],
        'access-control-request-headers': req.headers['access-control-request-headers']
      });
    } catch (e) {
      console.error('Error logging OPTIONS preflight:', e);
    }
    return res.sendStatus(204);
  }
  next();
});

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/test', testRoutes); // ✅ Test routes for manual testing
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

  // ✅ API root - return API index and helpful links
  app.get('/api', (req, res) => {
    res.json({
      success: true,
      message: 'TRENDZZ API root',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        posts: '/api/posts',
        users: '/api/users',
        chat: '/api/chat',
        notifications: '/api/notifications'
      }
    });
  });

  // DEBUG: log incoming registration requests for diagnosing signup network errors
  app.post('/api/debug/log-register', (req, res) => {
    try {
      console.log('--- DEBUG /api/debug/log-register received ---');
      console.log('Headers:', req.headers);
      console.log('Body:', req.body);
      console.log('OriginalUrl:', req.originalUrl);
      console.log('----------------------------------------------');

      // Reply with a simple acknowledgement and echo (safe for local dev)
      return res.json({ success: true, message: 'Logged request', headers: req.headers, body: req.body });
    } catch (err) {
      console.error('Debug log-register error:', err);
      return res.status(500).json({ success: false, message: 'Failed to log request' });
    }
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

// DEBUG: expose connected sockets and user mapping for troubleshooting
app.get('/debug/online-sockets', async (req, res) => {
  try {
    const ioInstance = app.get('io') || req.io;
    if (!ioInstance) return res.status(500).json({ success: false, message: 'Socket.io not initialized' });

    const onlineUsersMap = ioInstance.onlineUsers || new Map();
    const userSocketsMap = ioInstance.userSockets || new Map();
    const userRoomsMap = ioInstance.userRooms || new Map();

    // Convert Maps to plain objects/arrays for JSON
    const onlineUsers = Array.from(onlineUsersMap.entries()).map(([socketId, userId]) => ({ socketId, userId }));
    const userSockets = Array.from(userSocketsMap.entries()).map(([userId, socketId]) => ({ userId, socketId }));
    const userRooms = Array.from(userRoomsMap.entries()).map(([userId, rooms]) => ({ userId, rooms }));

    return res.json({ success: true, onlineUsers, userSockets, userRooms, serverTime: Date.now() });
  } catch (err) {
    console.error('Debug online-sockets error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch socket info' });
  }
});

// Alias for API-prefixed callers
app.get('/api/debug/online-sockets', async (req, res) => {
  try {
    const ioInstance = app.get('io') || req.io;
    if (!ioInstance) return res.status(500).json({ success: false, message: 'Socket.io not initialized' });

    const onlineUsersMap = ioInstance.onlineUsers || new Map();
    const userSocketsMap = ioInstance.userSockets || new Map();
    const userRoomsMap = ioInstance.userRooms || new Map();

    const onlineUsers = Array.from(onlineUsersMap.entries()).map(([socketId, userId]) => ({ socketId, userId }));
    const userSockets = Array.from(userSocketsMap.entries()).map(([userId, socketId]) => ({ userId, socketId }));
    const userRooms = Array.from(userRoomsMap.entries()).map(([userId, rooms]) => ({ userId, rooms }));

    return res.json({ success: true, onlineUsers, userSockets, userRooms, serverTime: Date.now() });
  } catch (err) {
    console.error('Debug online-sockets error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch socket info' });
  }
});

// DEBUG: Simulate follow notification to test socket emission
// Usage: GET /api/debug/simulate-follow?senderId=USER_A_ID&recipientId=USER_B_ID
app.get('/api/debug/simulate-follow', async (req, res) => {
  try {
    const { senderId, recipientId } = req.query;
    if (!senderId || !recipientId) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing params. Use: ?senderId=<id>&recipientId=<id>'
      });
    }

    console.log(`\n\n🔥🔥🔥 SIMULATE FOLLOW TEST START 🔥🔥🔥`);
    console.log(`Sender: ${senderId}, Recipient: ${recipientId}\n`);

    // Import here to avoid circular dependency
    const { createNotificationSafely } = await import('./utils/notificationHelper.js');
    const User = (await import('./models/User.js')).default;

    // Check users exist
    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);

    if (!sender) {
      return res.status(404).json({ success: false, message: `Sender not found: ${senderId}` });
    }
    if (!recipient) {
      return res.status(404).json({ success: false, message: `Recipient not found: ${recipientId}` });
    }

    console.log(`✅ Users exist: Sender="${sender.name}", Recipient="${recipient.name}"`);

    // Get socket instance
    const ioInstance = app.get('io') || req.io;
    const userSocketsMap = ioInstance.userSockets || new Map();
    const recipientSocketId = userSocketsMap.get(recipientId);

    console.log(`\n📡 Socket Status:`);
    console.log(`  Recipient ID: ${recipientId}`);
    console.log(`  Recipient Socket ID: ${recipientSocketId || 'NOT CONNECTED'}`);
    console.log(`  Total online users: ${userSocketsMap.size}`);

    // Create notification (same as real follow)
    console.log(`\n📧 Creating notification...`);
    const result = await createNotificationSafely({
      recipientId,
      senderId,
      type: 'follow',
      io: ioInstance
    });

    console.log(`\n✅ TEST COMPLETE\n`);

    return res.json({
      success: true,
      message: 'Follow notification test executed (check backend console logs)',
      test: {
        senderId,
        sendername: sender.name,
        recipientId,
        recipientName: recipient.name,
        recipientSocketId: recipientSocketId || 'OFFLINE',
        notificationCreated: result ? true : false,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('❌ Simulate follow error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
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

// Start server with retry on EADDRINUSE (attempt next ports automatically)
let activePort = parseInt(process.env.PORT, 10) || 5000;

const startServer = (port) => {
  server.listen(port, () => {
    console.log(`🎯 Server running on port ${port}`);
    console.log(`📡 API: http://localhost:${port}/api`);
    console.log(`🏠 Home: http://localhost:${port}/`);
    console.log(`☁️ Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configured ✅' : 'Not configured ❌'}`);
    console.log(`🔄 WebSocket: Active on /socket.io`);
    console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
  });
};

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.warn(`Port ${activePort} in use — attempting port ${activePort + 1}...`);
    activePort += 1;
    // wait briefly before retrying
    setTimeout(() => startServer(activePort), 300);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

startServer(activePort);

export { io };