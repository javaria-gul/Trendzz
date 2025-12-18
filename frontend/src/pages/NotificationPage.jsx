// src/pages/NotificationPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLeft from '../components/Home/SidebarLeft';
import SidebarRight from '../components/Home/SidebarRight';
import * as notificationService from '../services/notification';
import { AuthContext } from '../context/AuthContext';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread, mentions
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { userData } = useContext(AuthContext);

  // ✅ Fetch notifications on mount and when filter changes
  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  // ✅ Fetch unread count periodically
  useEffect(() => {
    const fetchCount = async () => {
      const result = await notificationService.getUnreadCount();
      if (result.success) {
        setUnreadCount(result.unreadCount);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const result = await notificationService.getNotifications(page, 20);
      if (result.success) {
        let filtered = result.data;
        
        // Apply filter
        if (filter === 'unread') {
          filtered = filtered.filter(n => !n.read);
        } else if (filter === 'mentions') {
          filtered = filtered.filter(n => n.type === 'mention');
        }
        
        setNotifications(filtered);
        setTotalPages(result.pagination?.pages || 1);
        setUnreadCount(result.unreadCount);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead();
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const result = await notificationService.deleteNotification(notificationId);
      if (result.success) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
      }
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      try {
        const result = await notificationService.deleteAllNotifications();
        if (result.success) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error('❌ Error deleting all:', error);
      }
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    // Navigate to relevant page based on notification type
    if (notification.postId) {
      navigate(`/post/${notification.postId}`);
    } else if (notification.type === 'follow' && notification.sender) {
      navigate(`/user/${notification.sender._id}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'like': return '❤️';
      case 'follow': return '👤';
      case 'comment': return '💬';
      case 'message': return '✉️';
      case 'mention': return '@';
      default: return '🔔';
    }
  };

  const getNotificationMessage = (notification) => {
    switch(notification.type) {
      case 'like':
        return `${notification.sender?.name || 'Someone'} liked your post`;
      case 'follow':
        return `${notification.sender?.name || 'Someone'} started following you`;
      case 'comment':
        return `${notification.sender?.name || 'Someone'} commented on your post`;
      case 'message':
        return `New message from ${notification.sender?.name || 'Someone'}`;
      case 'mention':
        return `${notification.sender?.name || 'Someone'} mentioned you`;
      default:
        return 'New notification';
    }
  };

  const timeAgo = (date) => {
    const now = new Date();
    const time = new Date(date);
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <SidebarLeft />
      
      {/* Main Notification Content */}
      <div className="flex-1 md:ml-20 lg:ml-24 xl:ml-28 md:mr-80 lg:mr-96 xl:mr-[400px]">
        <div className="max-w-3xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-gray-500 mt-1 md:mt-2">{unreadCount} unread</p>
                )}
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mt-4 md:mt-6">
              <button 
                onClick={() => { setFilter('all'); setPage(1); }}
                className={`px-3 py-2 md:px-4 md:py-3 font-medium border-b-2 text-sm md:text-base transition-colors ${
                  filter === 'all' 
                    ? 'text-purple-600 border-purple-600' 
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => { setFilter('unread'); setPage(1); }}
                className={`px-3 py-2 md:px-4 md:py-3 font-medium border-b-2 text-sm md:text-base transition-colors ${
                  filter === 'unread' 
                    ? 'text-purple-600 border-purple-600' 
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                Unread
              </button>
              <button 
                onClick={() => { setFilter('mentions'); setPage(1); }}
                className={`px-3 py-2 md:px-4 md:py-3 font-medium border-b-2 text-sm md:text-base transition-colors ${
                  filter === 'mentions' 
                    ? 'text-purple-600 border-purple-600' 
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                Mentions
              </button>
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {notifications.map((notification) => (
                <div 
                  key={notification._id}
                  className={`bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm border cursor-pointer transition-all hover:shadow-md ${
                    !notification.read 
                      ? 'border-l-4 border-l-purple-500 bg-purple-50' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-100 flex items-center justify-center text-base md:text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Avatar + Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        {notification.sender?.avatar && (
                          <img 
                            src={notification.sender.avatar} 
                            alt={notification.sender.name}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-gray-800 text-sm md:text-base">
                            {getNotificationMessage(notification)}
                          </p>
                          <p className="text-gray-400 text-xs md:text-sm mt-1">
                            {timeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                          className="text-xs md:text-sm text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap"
                        >
                          Mark read
                        </button>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification._id);
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12">
              <div className="text-4xl md:text-6xl mb-3 md:mb-4">🔔</div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-700">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-gray-500 text-sm md:text-base mt-1 md:mt-2">
                When you get notifications, they'll appear here.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && notifications.length > 0 && (
            <div className="mt-6 md:mt-8 flex justify-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <span className="px-3 py-2">
                Page {page} of {totalPages}
              </span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <button 
                onClick={handleMarkAllAsRead}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm md:text-base"
              >
                Mark all as read
              </button>
              <button 
                onClick={handleDeleteAll}
                className="text-red-500 hover:text-red-700 text-xs md:text-sm font-medium"
              >
                Delete all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block fixed right-0 top-0 h-screen w-80 overflow-y-auto">
        <SidebarRight />
      </div>
    </div>
  );
};

export default NotificationPage;