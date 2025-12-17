import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, MessageCircle, Bell, Search, PlusCircle, Settings, User, Moon, X 
} from "lucide-react";
import { searchUsers } from "../../services/user";
import { getChats } from "../../services/chat";
import { getNotifications, getUnreadCount, markAllAsRead } from "../../services/notification";
import { AuthContext } from "../../context/AuthContext";
import CreatePostModal from './CreatePostModal';


const SidebarLeft = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  
  const { userData } = useContext(AuthContext);
  const dropdownRef = useRef(null);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!userData?._id) return;
    
    setLoadingNotifications(true);
    try {
      console.log('🔵 [DEBUG] Fetching notifications...');
      const response = await getNotifications();
      console.log('🟢 [DEBUG] Response received:', response);
      
      if (response?.success) {
        console.log('🟢 [DEBUG] Success! Notifications:', response.data);
        setNotifications(response.data || []);
      } else {
        console.warn('🔴 [DEBUG] Response not successful:', response);
      }
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch unread count from API
  const fetchUnreadNotificationCount = async () => {
    if (!userData?._id) return;
    
    try {
      console.log('🔵 [DEBUG] Fetching unread count...');
      const response = await getUnreadCount();
      console.log('🟢 [DEBUG] Unread count response:', response);
      
      if (response?.success || response.success) {
        const count = response.data?.unreadCount || response.unreadCount || response.data?.count || 0;
        console.log('🟢 [DEBUG] Setting unread count to:', count);
        setUnreadNotificationCount(count);
      } else {
        console.warn('🔴 [DEBUG] Unread count response not successful:', response);
      }
    } catch (error) {
      console.error("❌ Error fetching unread count:", error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setUnreadNotificationCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Menu with dynamic badge count
  const menu = [
    { label: "Home", icon: <Home size={20} />, path: "/" },
    { 
      label: "Chat", 
      icon: <MessageCircle size={20} />, 
      path: "/chat",
      badgeCount: chatUnreadCount
    },
    { 
      label: "Notifications", 
      icon: <Bell size={20} />, 
      path: "#"
    },
    { label: "Search", icon: <Search size={20} />, path: "#" },
    { 
      label: "Create Post", 
      icon: <PlusCircle size={20} />, 
      path: "#",
      onClick: () => setShowCreatePostModal(true)
    },
    { label: "Profile", icon: <User size={20} />, path: "/profile" },
    { label: "Settings", icon: <Settings size={20} />, path: "/settings" },
  
  ];

  // Load notifications and counts
  useEffect(() => {
    if (userData?._id) {
      fetchNotifications();
      fetchUnreadNotificationCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadNotificationCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [userData]);

  // Fetch unread chat counts
  const fetchUnreadChatCounts = async () => {
    try {
      if (!userData?._id) return;
      
      const response = await getChats();
      if (response.data?.success) {
        const chats = response.data.data || [];
        let totalUsersWithUnread = 0;
        
        chats.forEach(chat => {
          if (chat.unreadCounts && typeof chat.unreadCounts.get === 'function') {
            const userUnread = chat.unreadCounts.get(userData._id) || 0;
            if (userUnread > 0) {
              totalUsersWithUnread++;
            }
          }
        });
        
        setChatUnreadCount(totalUsersWithUnread);
      }
    } catch (error) {
      console.error("Fetch unread counts error:", error);
    }
  };

  // Load unread chat counts
  useEffect(() => {
    if (userData?._id) {
      fetchUnreadChatCounts();
      const interval = setInterval(fetchUnreadChatCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [userData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search users function
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearchLoading(true);
      try {
        const response = await searchUsers(searchQuery);
        
        if (response.data.success && response.data.data) {
          setSearchResults(response.data.data);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Navigation function
  const handleNavigation = (path, label, onClick) => {
    if (path === "#") {
      if (label === "Search") {
        setActiveDropdown(activeDropdown === 'search' ? null : 'search');
      } else if (label === "Notifications") {
        const newState = activeDropdown === 'notifications' ? null : 'notifications';
        setActiveDropdown(newState);
        
        if (newState === 'notifications') {
          fetchNotifications();
        }
      } else if (label === "Create Post" && onClick) {
        onClick();
      }
      return;
    }
    
    // Handle theme toggle
    if (path === "/theme") {
      document.documentElement.classList.toggle('dark');
      return;
    }
    
    // For all other paths (including /search, /profile, etc.), navigate directly
    setActiveDropdown(null);
    navigate(path);
  };

  const handleSearchItemClick = (userId) => {
    navigate(`/user/${userId}`);
    setActiveDropdown(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchQuery.length >= 2 && searchResults.length > 0) {
      handleSearchItemClick(searchResults[0]._id);
    }
  };

  // Notification click handler
  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.isRead) {
      setNotifications(prev =>
        prev.map(n =>
          n._id === notification._id ? { ...n, isRead: true } : n
        )
      );
      setUnreadNotificationCount(prev => Math.max(0, prev - 1));
    }
    
    // Navigate based on type
    if (notification.post) {
      navigate(`/post/${notification.post._id}`);
    } else if (notification.sender) {
      navigate(`/profile/${notification.sender._id}`);
    }
    
    setActiveDropdown(null);
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    const icons = {
      'like': { emoji: '❤️', bg: 'bg-red-100', text: 'text-red-600' },
      'comment': { emoji: '💬', bg: 'bg-blue-100', text: 'text-blue-600' },
      'follow': { emoji: '👤', bg: 'bg-green-100', text: 'text-green-600' },
      'admired': { emoji: '🌟', bg: 'bg-yellow-100', text: 'text-yellow-600' },
      'default': { emoji: '🔔', bg: 'bg-purple-100', text: 'text-purple-600' }
    };
    
    const config = icons[type] || icons.default;
    
    return (
      <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
        <span className={`text-lg ${config.text}`}>{config.emoji}</span>
      </div>
    );
  };

  // Get time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  // Get badge count for menu
  const getBadgeCount = (item) => {
    if (item.label === "Chat") {
      return chatUnreadCount;
    }
    if (item.label === "Notifications") {
      return unreadNotificationCount;
    }
    return 0;
  };

  // Search dropdown
  const renderSearchDropdown = () => (
    <div 
      ref={dropdownRef}
      className={`absolute left-16 top-4 bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 z-50 max-h-[80vh] overflow-hidden`}
    >
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isSearchLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 text-sm mt-2">Searching users...</p>
          </div>
        ) : searchQuery.length >= 2 && searchResults.length === 0 ? (
          <div className="p-6 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No users found for</p>
            <p className="text-gray-700 font-medium">"{searchQuery}"</p>
            <p className="text-gray-400 text-xs mt-2">Try different keywords</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
              Users ({searchResults.length})
            </div>
            {searchResults.map((user) => (
              <button
                key={user._id}
                onClick={() => handleSearchItemClick(user._id)}
                className="w-full text-left px-4 py-3 hover:bg-purple-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="relative">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  {user.onlineStatus === 'online' && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{user.name}</p>
                  <p className="text-gray-500 text-xs truncate">@{user.username}</p>
                  {user.role && (
                    <p className="text-gray-400 text-xs capitalize">{user.role}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Search for users</p>
            <p className="text-gray-400 text-xs mt-1">Type at least 2 characters</p>
          </div>
        )}
      </div>
    </div>
  );

  // Notifications dropdown
  const renderNotificationsDropdown = () => {
    return (
      <div 
        ref={dropdownRef}
        className={`absolute left-16 top-4 bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 z-50 max-h-[80vh] overflow-hidden`}
      >
        <div className="p-4 border-b border-gray-200 bg-white sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <p className="text-gray-500 text-sm">
                {unreadNotificationCount > 0 ? `${unreadNotificationCount} new` : "No new notifications"}
              </p>
            </div>
            {unreadNotificationCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loadingNotifications ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 text-sm mt-2">Loading notifications...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="py-2">
              {notifications.map((notification) => (
                <button
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-b-0 ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-sm">
                      {notification.message || (
                        notification.type === 'follow'
                          ? `${notification.sender?.name} followed you`
                          : notification.type === 'admired'
                            ? `${notification.sender?.name} admired you`
                            : `${notification.sender?.name} ${notification.type}ed`
                      )}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {getTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No notifications yet</p>
              <p className="text-gray-400 text-xs mt-1">Your notifications will appear here</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-200 bg-white sticky bottom-0">
          <button 
            onClick={() => {
              navigate('/notifications');
              setActiveDropdown(null);
            }}
            className="w-full text-center text-purple-600 hover:text-purple-700 text-sm font-medium py-2"
          >
            View All Notifications
          </button>
        </div>
      </div>
    );
  };

  // Get badge color
  const getBadgeColor = (count) => {
    if (count > 9) return 'bg-red-600';
    if (count > 5) return 'bg-red-500';
    return 'bg-red-500';
  };

  return (
    <>
      <div className="hidden md:flex flex-col items-center py-6 h-[calc(100vh-30px)] fixed left-2 top-4 bottom-4 w-16 bg-blue-900 shadow-2xl rounded-3xl border border-blue-700 z-40">
        <ul className="flex flex-col items-center space-y-3 mt-2">
          {menu.map((item, index) => {
            const badgeCount = getBadgeCount(item);
            const isActive = location.pathname === item.path || 
              (item.label === "Search" && activeDropdown === 'search') ||
              (item.label === "Notifications" && activeDropdown === 'notifications');

            return (
              <li
                key={index}
                className={`
                  group w-10 h-10 flex items-center justify-center rounded-xl 
                  transition-all cursor-pointer relative
                  ${isActive ? 'bg-yellow-400 text-gray-900' : 'text-white hover:bg-yellow-400 hover:text-gray-900'}
                `}
                title={`${item.label}${badgeCount > 0 ? ` (${badgeCount})` : ''}`}
                onClick={() => handleNavigation(item.path, item.label, item.onClick)}
              >
                {item.icon}
                
                {badgeCount > 0 && (
                  <span className={`
                    absolute -top-1 -right-1 ${getBadgeColor(badgeCount)} 
                    text-white text-xs font-bold rounded-full 
                    min-w-[18px] h-[18px] flex items-center justify-center 
                    px-1 border-2 border-blue-900 shadow-sm
                    ${badgeCount > 9 ? 'text-[10px]' : 'text-xs'} animate-pulse
                  `}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {activeDropdown === 'search' && renderSearchDropdown()}
        {activeDropdown === 'notifications' && renderNotificationsDropdown()}
      </div>

      {showCreatePostModal && (
        <CreatePostModal
          onClose={() => setShowCreatePostModal(false)}
          onPostCreated={() => {
            alert('Post created successfully!');
          }}
        />
      )}
    </>
  );
};

export default SidebarLeft;