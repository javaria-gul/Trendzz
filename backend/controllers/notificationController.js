import Notification from '../models/Notification.js';
import xss from 'xss'; // ✅ XSS sanitization
import { createNotificationSafely, getNotificationStats } from '../utils/notificationHelper.js';

// ✅ Rate limiting map (user -> { count, resetTime })
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // max 100 requests per minute

// ✅ Rate limiter middleware
const checkRateLimit = (userId) => {
  const now = Date.now();
  const record = rateLimitMap.get(userId.toString());

  if (!record || now > record.resetTime) {
    rateLimitMap.set(userId.toString(), {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
};

// ✅ IMPROVED: Create notification with validation
export const createNotification = async (recipientId, senderId, type, postId = null, commentId = null, io = null) => {
  try {
    console.log('🔔 createNotification called:', { recipientId, senderId, type, hasIO: !!io });
    return await createNotificationSafely({
      recipientId,
      senderId,
      type,
      postId,
      commentId,
      io
    });
  } catch (error) {
    console.error('❌ Error creating notification:', error.message);
    throw error;
  }
};

// ✅ IMPROVED: Get user notifications with pagination
export const getUserNotifications = async (req, res) => {
  try {
    // ✅ Rate limiting
    if (!checkRateLimit(req.user._id)) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page || 1));
    const limit = Math.min(50, parseInt(req.query.limit || 20));
    
    // ✅ Validate page and limit
    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    const skip = (page - 1) * limit;

    // ✅ Parallel queries for performance
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .populate('sender', 'name username avatar')
        .populate('postId', 'content media')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, read: false })
    ]);
    
    res.json({ 
      success: true, 
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      unreadCount: unreadCount
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ NEW: Get unread count only
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      read: false 
    });
    
    res.json({ 
      success: true, 
      unreadCount: unreadCount
    });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ NEW: Get notification stats
export const getNotificationStatsHandler = async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await getNotificationStats(userId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ IMPROVED: Mark as read with validation
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    // ✅ Validate ID format
    if (!notificationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format'
      });
    }

    // ✅ Verify ownership
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Cannot mark other users notifications as read'
      });
    }

    if (notification.read) {
      return res.json({
        success: true,
        message: 'Notification already read'
      });
    }

    await Notification.findByIdAndUpdate(notificationId, { read: true });
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ IMPROVED: Mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );
    
    res.json({ 
      success: true, 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ NEW: Delete notification with security
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    // ✅ Validate ID format
    if (!notificationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format'
      });
    }

    // ✅ Verify ownership
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Cannot delete other users notifications'
      });
    }

    await Notification.findByIdAndDelete(notificationId);
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ NEW: Delete all notifications
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await Notification.deleteMany({ recipient: userId });
    
    res.json({ 
      success: true, 
      message: 'All notifications deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error deleting all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};