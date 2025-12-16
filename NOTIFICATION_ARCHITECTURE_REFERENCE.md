# Complete Notification System - API Reference & Architecture

## 🎯 System Overview

The Trendzz notification system has 3 layers:

1. **Database Layer** (MongoDB)
   - Stores persistent notification records
   - Tracks read/unread status
   - Supports 6 notification types

2. **REST API Layer** (Express)
   - POST endpoints for actions (like, comment, follow, admire)
   - GET endpoints for fetching notifications
   - Automatically creates notifications when actions happen

3. **Real-time Layer** (Socket.io)
   - Instantly delivers notifications to connected users
   - Works even if user switches tabs
   - Delivers offline - user receives on next connection

---

## 🔧 Notification-Triggering Endpoints

### 1. Like Action
```
POST /api/posts/:postId/like
Auth: Required
Handler: postController.toggleLike()
Notification Type: 'like'
```
**Request:**
```bash
curl -X POST http://localhost:5000/api/posts/507f1f77bcf86cd799439011/like \
  -H "Authorization: Bearer [token]"
```

**Response:**
```json
{
  "success": true,
  "message": "Post liked",
  "likes": 5,
  "isLiked": true
}
```

### 2. Comment Action
```
POST /api/posts/comment
Auth: Required
Handler: postController.addCommentNew()
Notification Type: 'comment' + 'mention' (if @mentioned)
```
**Request:**
```bash
curl -X POST http://localhost:5000/api/posts/comment \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "507f1f77bcf86cd799439011",
    "text": "Nice post @username!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "comment": {
    "_id": "507f1f77bcf86cd799439014",
    "user": {"_id": "...", "name": "John", "avatar": "..."},
    "text": "Nice post @username!",
    "createdAt": "2025-12-15T10:30:00Z"
  },
  "totalComments": 3
}
```

### 3. Follow Action
```
POST /api/users/:userId/follow
Auth: Required
Handler: userRoutes handler (line ~280)
Notification Type: 'follow'
```
**Request:**
```bash
curl -X POST http://localhost:5000/api/users/507f1f77bcf86cd799439012/follow \
  -H "Authorization: Bearer [token]"
```

**Response:**
```json
{
  "success": true,
  "message": "User followed successfully",
  "isFollowing": true,
  "followersCount": 10
}
```

### 4. Admiration Action
```
POST /api/users/admire/:userId
Auth: Required
Handler: userRoutes handler (line ~490)
Notification Type: 'admired'
```
**Request:**
```bash
curl -X POST http://localhost:5000/api/users/507f1f77bcf86cd799439012/admire \
  -H "Authorization: Bearer [token]"
```

**Response:**
```json
{
  "success": true,
  "message": "User admired successfully",
  "action": "admired",
  "admirersCount": 8,
  "isAdmired": true
}
```

### 5. Message Action
```
Socket.io Event: 'send_message'
Handler: socket.js (line ~250)
Notification Type: 'message'
```
**Socket Emit:**
```javascript
socket.emit('send_message', {
  chatId: '507f1f77bcf86cd799439014',
  recipientId: '507f1f77bcf86cd799439012',
  message: 'Hello!'
});
```

---

## 📬 Notification Retrieval Endpoints

### Get Notifications with Pagination
```
GET /api/notifications?page=1&limit=20
Auth: Required
Handler: notificationController.getUserNotifications()
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f...",
      "type": "like",
      "sender": {
        "_id": "507f...",
        "name": "John Doe",
        "username": "johndoe",
        "avatar": "https://..."
      },
      "postId": "507f...",
      "read": false,
      "createdAt": "2025-12-15T10:30:00Z"
    }
  ],
  "unreadCount": 5,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2
  }
}
```

### Get Unread Count
```
GET /api/notifications/unread-count
Auth: Required
Handler: notificationController.getUnreadCount()
```

**Response:**
```json
{
  "success": true,
  "unreadCount": 5
}
```

### Mark as Read
```
PUT /api/notifications/:notificationId/read
Auth: Required
Handler: notificationController.markNotificationAsRead()
```

### Mark All as Read
```
PUT /api/notifications/read-all
Auth: Required
Handler: notificationController.markAllAsRead()
```

### Delete Notification
```
DELETE /api/notifications/:notificationId
Auth: Required
Handler: notificationController.deleteNotification()
```

---

## 🔌 Socket.io Real-time Events

### Notification Received Event
**Emitted by:** `notificationHelper.createNotificationSafely()`
**Received by:** Frontend `notification.js:subscribeToNotifications()`

```javascript
// Backend emits:
io.to(`user:${recipientId}`).emit('notification_received', {
  notification: {
    _id: '507f...',
    type: 'like',
    sender: {...},
    postId: '507f...',
    read: false,
    createdAt: '2025-12-15T10:30:00Z'
  },
  unreadCount: 5
});

// Frontend receives:
socket.on('notification_received', (data) => {
  console.log('New notification:', data);
  // Updates state
  // Updates UI
  // Plays sound (optional)
});
```

### Room Membership
Users automatically join these rooms on socket connection:
- Primary: `user:${userId}` (preferred for new connections)
- Legacy: `${userId}` (for backward compatibility)
- Chat rooms: `${chatId}` (when joining chat)
- Post rooms: `post_${postId}` (when viewing post)

---

## 📊 Notification Type Summary

| Type | Triggered By | Recipient | Example |
|------|--------------|-----------|---------|
| `like` | User clicks like button | Post owner | "John liked your post" |
| `comment` | User adds comment | Post owner | "John commented on your post" |
| `mention` | User includes @name in comment/post | Mentioned user | "John mentioned you in a comment" |
| `follow` | User clicks follow button | User being followed | "John followed you" |
| `admired` | User clicks admire button | Admired user | "John admired you" |
| `message` | User sends chat message | Message recipient | "John sent you a message" |

---

## 🔄 Complete Request-Response Flow

### Example: User B Likes User A's Post

```
FRONTEND (User B)
├─ Click like button
├─ Call: postsAPI.likePost(postId)
└─ Axios: POST /api/posts/507f.../like

    ↓

BACKEND
├─ Route: POST /api/posts/:postId/like
├─ Middleware: authMiddleware (req.user = User B)
├─ Middleware: req.io attached
├─ Controller: toggleLike()
│  ├─ Find post
│  ├─ Add User B to post.likes array
│  ├─ Save post to MongoDB
│  ├─ Call: createNotificationSafely({
│  │  ├─ recipientId: User A
│  │  ├─ senderId: User B
│  │  ├─ type: 'like'
│  │  ├─ postId: 507f...
│  │  └─ io: req.io
│  │})
│  │
│  │ Inside createNotificationSafely:
│  │ ├─ Validate inputs
│  │ ├─ Create Notification document
│  │ ├─ Save to MongoDB
│  │ ├─ Get unreadCount
│  │ └─ io.to(`user:${User A}._id`).emit('notification_received', {...})
│  │
│  └─ Return response
└─ Response: { success: true, likes: 5, isLiked: true }

    ↓

FRONTEND (User B)
├─ Receive success response
├─ Update UI: like count becomes 5
└─ UI shows "You liked this post"

    ↓

SOCKET.IO
├─ Emit: 'notification_received' to rooms: `user:${User A._id}` and `${User A._id}`
└─ All connected sockets for User A receive event

    ↓

FRONTEND (User A - if connected)
├─ Socket listens for 'notification_received'
├─ Handler: subscribeToNotifications callback
├─ SocketContext: Update notifications state
├─ State change triggers re-render
├─ NotificationBadge: Shows new unread count (1)
├─ SidebarLeft: Shows new notification in list
└─ Display: "John liked your post" with ❤️ icon

    ↓

DATABASE (MongoDB)
├─ Post document: likes array now includes User B's ID
├─ Notification document created with:
│  ├─ type: 'like'
│  ├─ recipient: User A
│  ├─ sender: User B
│  ├─ postId: 507f...
│  ├─ read: false
│  └─ createdAt: 2025-12-15T10:30:00Z
└─ Data persists across page refreshes
```

---

## 🔐 Authentication & Authorization

### JWT Token Flow
```
1. User logs in → Backend generates JWT with userId
2. Frontend stores token in localStorage.trendzz_token
3. Axios interceptor adds: Authorization: Bearer {token}
4. Backend authMiddleware decodes JWT → req.user = User object
5. Socket.io auth: { token: jwt } in handshake
6. Socket.io middleware verifies token → socket.userId = userId
```

### Authorization Checks
- Like/comment: Requires authentication (any user can do it)
- Follow: Requires authentication + not self
- Admire: Requires authentication + not self
- Delete: Requires authentication + post owner

---

## 🐛 Common Issues & Solutions

### Issue: Notifications appear in DB but not in real-time
**Solution:**
1. Check Socket.io connection: `socket?.connected` should be `true`
2. Check socket room membership: `socket?.rooms` should include `user:${userId}`
3. Check listener: `socket?.listeners('notification_received')` should have entries
4. Check backend logs: Should see "✅ Emitted to room:" messages

### Issue: Notifications don't persist after refresh
**Solution:**
1. Check MongoDB: Notification documents should be created
2. Check endpoint: GET /api/notifications should return them
3. Check frontend fetch: `getNotifications()` should be called on mount

### Issue: Duplicate notifications
**Solution:**
1. Debounce frontend button clicks
2. Check for duplicate notification creation in DB
3. Race condition fix: Use `Promise.all()` for parallel operations

### Issue: Mentions not working
**Solution:**
1. Comment text must contain exactly `@username` format
2. Username must exist and have exact case match
3. User cannot mention themselves
4. Mention creates BOTH 'comment' and 'mention' notifications

---

## 📈 Performance Optimization Tips

### Current Optimizations:
- ✅ Rate limiting on notification GET (100 req/min)
- ✅ Pagination on notification fetch (20 per page)
- ✅ Duplicate detection (within 5 seconds)
- ✅ Privacy settings check (allowMessages)

### Additional Optimizations to Consider:
- [ ] Add Redis caching for unread count
- [ ] Aggregate mention notifications (if 3+ mentions in same comment)
- [ ] Batch notification socket emissions
- [ ] Archive old notifications (>30 days)
- [ ] Add notification preferences per notification type

---

## ✅ Verification Checklist

- [ ] All 6 notification types exist in Notification.js enum
- [ ] All action endpoints call `createNotificationSafely` with `io: req.io`
- [ ] Socket.io server is initialized before routes
- [ ] Frontend Socket context subscribes to `notification_received`
- [ ] Frontend fetches notifications on app mount
- [ ] UI components display all 6 notification types
- [ ] Notifications persist in MongoDB
- [ ] Notifications emit in real-time via Socket.io
- [ ] Unread count updates correctly
- [ ] Mark as read functionality works
- [ ] Delete notification functionality works

