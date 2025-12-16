import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
  getNotificationStatsHandler
} from '../controllers/notificationController.js';

const router = express.Router();

// ✅ FIXED: Order routes correctly (specific before parametric)
// Get all notifications for logged in user
router.get('/', authMiddleware, getUserNotifications);

// ✅ NEW: Get unread count
router.get('/unread-count', authMiddleware, getUnreadCount);

// ✅ NEW: Get notification statistics
router.get('/stats', authMiddleware, getNotificationStatsHandler);

// Mark all notifications as read (BEFORE /:notificationId)
router.put('/read-all', authMiddleware, markAllAsRead);

// ✅ NEW: Delete all notifications
router.delete('/delete-all', authMiddleware, deleteAllNotifications);

// Mark single notification as read
router.put('/:notificationId/read', authMiddleware, markAsRead);

// ✅ NEW: Delete single notification
router.delete('/:notificationId', authMiddleware, deleteNotification);

export default router;