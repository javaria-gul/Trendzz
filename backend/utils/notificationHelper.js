// backend/utils/notificationHelper.js
// ✅ Centralized notification helper with security & exception handling

import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import xss from 'xss';

/**
 * ✅ Securely create notification with validation & error handling
 * @param {Object} options - Configuration object
 * @param {String} options.recipientId - User receiving notification
 * @param {String} options.senderId - User sending notification
 * @param {String} options.type - Notification type (like|comment|follow|mention|message)
 * @param {String} options.postId - Associated post (optional)
 * @param {String} options.commentId - Associated comment (optional)
 * @param {Object} options.io - Socket.io instance for real-time updates
 * @returns {Object} Notification object or null
 */
export const createNotificationSafely = async (options = {}) => {
  try {
    const {
      recipientId,
      senderId,
      type,
      postId = null,
      commentId = null,
      io = null,
      data = {}
    } = options;

    // ✅ Validation
    if (!recipientId || !senderId || !type) {
      throw new Error('Missing required fields: recipientId, senderId, type');
    }

    // ✅ Valid types
    const validTypes = ['like', 'comment', 'follow', 'message', 'mention', 'admired'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid notification type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }

    // ✅ Prevent self-notifications
    if (recipientId.toString() === senderId.toString()) {
      console.log('ℹ️ Skipped self-notification');
      return null;
    }

    // ✅ Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new Error(`Recipient user not found: ${recipientId}`);
    }

    // ✅ Verify sender exists
    const sender = await User.findById(senderId);
    if (!sender) {
      throw new Error(`Sender user not found: ${senderId}`);
    }

    // ✅ Check privacy settings
    if (type === 'message' && !recipient.privacySettings?.allowMessages) {
      console.log(`ℹ️ Notification skipped - recipient has messages disabled`);
      return null;
    }

    // ✅ Prevent duplicate notifications (within last 5 seconds for same type/sender)
    const recentNotification = await Notification.findOne({
      recipient: recipientId,
      sender: senderId,
      type,
      createdAt: { $gte: new Date(Date.now() - 5000) }
    });

    if (recentNotification && type !== 'comment') {
      console.log('ℹ️ Skipped duplicate notification (within 5 seconds)');
      return null;
    }

    // ✅ Sanitize data
    const sanitizedData = {};
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        sanitizedData[key] = xss(data[key]);
      } else {
        sanitizedData[key] = data[key];
      }
    });

    // ✅ Create notification
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      postId,
      commentId,
      data: sanitizedData,
      read: false
    });

    await notification.save();

    // ✅ Populate before returning
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name username avatar')
      .populate('postId', 'content media');

    console.log(`✅ Notification created: ${type} from ${sender.name} to ${recipient.name}`);

    // ✅ Emit real-time update via Socket.io
    if (io) {
      try {
        const unreadCount = await Notification.countDocuments({ recipient: recipientId, read: false });
        
        const recipientIdStr = recipientId.toString();
        const notificationPayload = {
          notification: populatedNotification,
          unreadCount
        };

        // Try both room names: `user:${id}` (preferred) and plain `${id}` (fallback)
        console.log(`📡 Emitting notification_received to rooms for user: ${recipientIdStr}`);
        
        // Emit to primary room
        io.to(`user:${recipientIdStr}`).emit('notification_received', notificationPayload);
        console.log(`✅ Emitted to room: user:${recipientIdStr}`);
        
        // Also emit to legacy room for compatibility
        io.to(recipientIdStr).emit('notification_received', notificationPayload);
        console.log(`✅ Emitted to room: ${recipientIdStr}`);

      } catch (socketError) {
        console.error('⚠️ Socket emission failed (non-critical):', socketError.message);
      }
    } else {
      console.warn('⚠️ No io instance provided to createNotificationSafely');
    }

    return populatedNotification;

  } catch (error) {
    console.error('❌ Notification creation error:', error.message);
    throw error;
  }
};

/**
 * ✅ Get notification with security checks
 */
export const getNotificationWithPermission = async (notificationId, userId) => {
  try {
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    // ✅ Verify ownership
    if (notification.recipient.toString() !== userId.toString()) {
      throw new Error('Unauthorized: You can only view your own notifications');
    }

    return notification;
  } catch (error) {
    console.error('❌ Permission check failed:', error.message);
    throw error;
  }
};

/**
 * ✅ Bulk create notifications for multiple recipients
 */
export const createBulkNotifications = async (options = {}) => {
  try {
    const {
      recipientIds = [],
      senderId,
      type,
      postId = null,
      commentId = null,
      io = null
    } = options;

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      throw new Error('recipientIds must be a non-empty array');
    }

    // ✅ Filter out sender from recipients
    const filteredRecipients = recipientIds.filter(
      id => id.toString() !== senderId.toString()
    );

    if (filteredRecipients.length === 0) {
      return [];
    }

    // ✅ Create notifications in parallel
    const notifications = await Promise.all(
      filteredRecipients.map(recipientId =>
        createNotificationSafely({
          recipientId,
          senderId,
          type,
          postId,
          commentId,
          io
        }).catch(error => {
          console.error(`Failed to notify ${recipientId}:`, error.message);
          return null;
        })
      )
    );

    return notifications.filter(n => n !== null);

  } catch (error) {
    console.error('❌ Bulk notification error:', error.message);
    throw error;
  }
};

/**
 * ✅ Clean up old notifications (run periodically)
 */
export const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    console.log(`✅ Cleaned up ${result.deletedCount} old notifications (>${daysOld} days)`);
    return result;

  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
    throw error;
  }
};

/**
 * ✅ Get notification stats for user
 */
export const getNotificationStats = async (userId) => {
  try {
    const stats = await Promise.all([
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, read: false }),
      Notification.countDocuments({ recipient: userId, type: 'like' }),
      Notification.countDocuments({ recipient: userId, type: 'comment' }),
      Notification.countDocuments({ recipient: userId, type: 'follow' }),
      Notification.countDocuments({ recipient: userId, type: 'mention' })
    ]);

    return {
      total: stats[0],
      unread: stats[1],
      likes: stats[2],
      comments: stats[3],
      follows: stats[4],
      mentions: stats[5]
    };

  } catch (error) {
    console.error('❌ Stats error:', error.message);
    throw error;
  }
};
