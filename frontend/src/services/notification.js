// frontend/src/services/notification.js
// ✅ Comprehensive notification service with error handling

import api from './api';

/**
 * ✅ Fetch notifications with pagination
 */
export const getNotifications = async (page = 1, limit = 20) => {
  try {
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('Invalid page number');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new Error('Limit must be between 1 and 50');
    }

    const response = await api.get('/notifications', {
      params: { page, limit },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return { 
      success: false, 
      data: [],
      unreadCount: 0,
      pagination: { total: 0, page: 1, limit, pages: 0 },
      error: error.message
    };
  }
};

/**
 * ✅ Fetch unread count
 */
export const getUnreadCount = async () => {
  try {
    const response = await api.get('/notifications/unread-count', {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    return { 
      success: false, 
      unreadCount: 0,
      error: error.message
    };
  }
};

/**
 * ✅ Fetch notification statistics
 */
export const getNotificationStats = async () => {
  try {
    const response = await api.get('/notifications/stats', {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    return { 
      success: false, 
      stats: {},
      error: error.message
    };
  }
};

/**
 * ✅ Mark notification as read
 */
export const markAsRead = async (notificationId) => {
  try {
    if (!notificationId || typeof notificationId !== 'string') {
      throw new Error('Invalid notification ID');
    }

    const response = await api.put(`/notifications/${notificationId}/read`, {}, {
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
};

/**
 * ✅ Mark all as read
 */
export const markAllAsRead = async () => {
  try {
    const response = await api.put('/notifications/read-all', {}, {
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error marking all as read:', error);
    throw error;
  }
};

/**
 * ✅ Delete notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    if (!notificationId || typeof notificationId !== 'string') {
      throw new Error('Invalid notification ID');
    }

    const response = await api.delete(`/notifications/${notificationId}`, {
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    throw error;
  }
};

/**
 * ✅ Delete all notifications
 */
export const deleteAllNotifications = async () => {
  try {
    const response = await api.delete('/notifications/delete-all', {
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting all notifications:', error);
    throw error;
  }
};

/**
 * ✅ Batch delete notifications
 */
export const deleteNotificationsBatch = async (notificationIds = []) => {
  try {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw new Error('No notifications to delete');
    }

    // ✅ Delete in parallel
    const deletePromises = notificationIds.map(id => 
      deleteNotification(id).catch(err => {
        console.error(`Failed to delete ${id}:`, err.message);
        return null;
      })
    );

    const results = await Promise.all(deletePromises);
    const successful = results.filter(r => r !== null).length;

    return {
      success: true,
      deleted: successful,
      failed: notificationIds.length - successful,
      message: `Deleted ${successful} of ${notificationIds.length} notifications`
    };
  } catch (error) {
    console.error('❌ Error in batch delete:', error);
    throw error;
  }
};

/**
 * ✅ Subscribe to real-time notifications (Socket.io)
 */
export const subscribeToNotifications = (socket, onNotification) => {
  if (!socket) {
    console.error('❌ Socket not available');
    return;
  }

  socket.on('notification_received', (data) => {
    console.log('📬 Real-time notification received:', data);
    if (onNotification) {
      onNotification(data);
    }
  });

  socket.on('notification_error', (error) => {
    console.error('❌ Notification error via socket:', error);
  });
};

/**
 * ✅ Unsubscribe from real-time notifications
 */
export const unsubscribeFromNotifications = (socket) => {
  if (!socket) return;
  socket.off('notification_received');
  socket.off('notification_error');
};