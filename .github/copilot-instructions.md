# Trendzz  Instructions

## Overview
**Trendzz** is a full-stack MERN social media platform with real-time chat and trend prediction features. The codebase uses **ES6 modules** throughout, **JWT authentication**, **Socket.io** for real-time communication, and **Cloudinary** for media uploads.

## Critical Architecture Patterns

### Three-Layer Data Flow
1. **Frontend (React)** → axios API calls through `src/services/*.js`
2. **Backend (Express)** → JWT-protected routes in `routes/` using `authMiddleware`
3. **Database (MongoDB)** → Mongoose models with refs for relationships

**Key insight**: Frontend stores JWT in `localStorage.trendzz_token` and passes it as `Authorization: Bearer <token>` header. Backend validates every protected route with `authMiddleware` which decorates `req.user`.

### Real-time Communication Pattern
- **Socket.io server** (`backend/socket/socket.js`) runs alongside Express on same HTTP server
- **Socket authentication**: Token passed in handshake auth, verified before connection allowed
- **Maps maintained**: `onlineUsers` (socketId→userId), `userSockets` (userId→socketId), `userRooms` (userId→roomIds)
- **Frontend**: Single `<SocketProvider>` wrapper around Router provides `socket` context to all components

Example: For chat features, emit from frontend with `socket.emit('message', {...})` and listen on backend with `socket.on('message', handleMessage)`.

### Cloudinary Media Upload
All file uploads use Cloudinary with `multer-storage-cloudinary` backend:
- **Post images/videos**: Stored in `social-media-posts` folder
- **Profile avatars**: Built-in system at `/avatars/avatar*.png`
- **Config**: `backend/config/cloudinary.js` with environment variables `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

Post model stores `media: [{url, type: 'image'|'video', public_id}]` array for multiple files per post.

## Essential File References

### Backend
- **Routes**: `/api/auth`, `/api/posts`, `/api/users`, `/api/chat`, `/api/notifications`
- **Models**: Post, User, Chat, Notification with `.ref()` fields for relationships
- **Controllers**: Business logic separated from routes
- **Middleware**: `authMiddleware` validates JWT and populates `req.user`; `uploadMiddleware` handles file streams

### Frontend
- **Contexts**: `AuthContext` (user token/data), `SocketContext` (socket instance + onlineUsers)
- **Pages**: Wrapped in `<ProtectedRoute>` for auth check, `<OnboardingCheck>` for first-login redirect
- **Services**: `api.js` (axios interceptor adds token), `auth.js`, `posts.js`, `user.js`, `chat.js`, `notification.js`

## Developer Commands

```bash
# Backend
cd backend && npm install
npm run dev              # nodemon watch mode on port 5000
npm start              # production mode

# Frontend  
cd frontend && npm install
npm start              # dev server on port 3000 (CORS configured for 5000)
npm build              # production build
```

**Key URLs**: Frontend `http://localhost:3000`, Backend `http://localhost:5000`, Socket.io on same server as backend.

## Project-Specific Patterns

### 1. ES6 Module Usage
All `.js` files use `import/export`. `package.json` has `"type": "module"`. Fix `__dirname` with:
```javascript
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

### 2. User Authentication Flow
- Register/Login in `userController.js` returns JWT token
- Frontend stores token locally, passes in all API requests
- Backend authMiddleware finds user by decoded JWT `id`, attaches to `req.user`
- Logout clears localStorage and all session/cache data

### 3. Post-User Relationships
Posts have `user: ObjectId ref User`. When querying posts, use `.populate('user')` to fetch user details. Similar for comments: `comment.user` refs User.

### 4. Privacy Settings Pattern
User model includes `privacySettings` object with boolean flags (`profilePublic`, `allowMessages`, etc.). Check before allowing actions in controllers.

### 5. Socket Event Naming
Follow pattern: `snake_case` for event names (`user_online`, `message_sent`, `notification_received`). Always emit with data object: `socket.emit('event', { userId, data })`.

## Common Modification Points

- **Adding new post fields**: Update Post model `postSchema`, controller logic, frontend form
- **Adding socket events**: Define in `backend/socket/socket.js` with `socket.on()`, emit from frontend with `socket.emit()`
- **Adding API routes**: Create route file in `routes/`, controller in `controllers/`, import in `server.js`
- **Styling**: Frontend uses **Tailwind CSS** with `tailwind.config.js` + PostCSS

## Known Technical Decisions

- **No Redux**: Uses React Context for state (simpler for this scale)
- **Cloudinary over local storage**: Scales better, no server disk management
- **Single SocketProvider**: Prevents multiple socket connections; all components share same socket instance
- **XSS sanitization**: Input sanitized with `xss` package in controllers
- **Mongoose population**: Use `.populate('fieldName')` for nested documents, specify fields with `.populate('user', 'name avatar')`

## Debugging Tips

- Check `Authorization` header format in frontend API calls: must be `Bearer <token>`
- Socket auth fails silently—add console logs in `socket/socket.js` middleware
- Post creation needs `req.files` from multer, not `req.body`
- Cloudinary timeouts occur on large files—increase `chunk_size` and `timeout` in upload config
