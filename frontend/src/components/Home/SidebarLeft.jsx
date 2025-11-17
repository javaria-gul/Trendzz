// SidebarLeft.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  MessageCircle, 
  Bell, 
  Search, 
  PlusCircle, 
  Settings, 
  User, 
  Moon,
  X
} from "lucide-react";
import { searchUsers } from "../../services/user";

const SidebarLeft = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const menu = [
    { label: "Home", icon: <Home size={20} />, path: "/" },
    { label: "Chat", icon: <MessageCircle size={20} />, path: "/chat" },
    { label: "Notifications", icon: <Bell size={20} />, path: "#" },
    { label: "Search", icon: <Search size={20} />, path: "#" },
    { label: "Create Post", icon: <PlusCircle size={20} />, path: "/create-post" },
    { label: "Profile", icon: <User size={20} />, path: "/profile" },
    { label: "Settings", icon: <Settings size={20} />, path: "/settings" },
    { label: "Dark Mode", icon: <Moon size={20} />, path: "/theme" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
        setSearchQuery("");
        setSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search users function - PROPERLY WORKING
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearchLoading(true);
      try {
        const response = await searchUsers(searchQuery);
        
        // Proper response handling
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

  // Mock notifications data
  useEffect(() => {
    const mockNotifications = [
      { id: 1, type: "like", user: "John Doe", message: "liked your post", time: "5 min ago" },
      { id: 2, type: "follow", user: "Sarah Smith", message: "started following you", time: "1 hour ago" },
      { id: 3, type: "comment", user: "Mike Johnson", message: "commented on your post", time: "2 hours ago" },
    ];
    setNotifications(mockNotifications);
  }, []);

  const handleNavigation = (path, label) => {
    if (path === "#") {
      if (label === "Search") {
        setActiveDropdown(activeDropdown === 'search' ? null : 'search');
      } else if (label === "Notifications") {
        setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications');
      }
      return;
    }
    
    if (path === "/theme") {
      document.documentElement.classList.toggle('dark');
      return;
    }
    
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

  // Dropdown position - Top pe khulega
  const getDropdownPosition = () => {
    return "left-16 top-4";
  };

  const renderSearchDropdown = () => (
    <div 
      ref={dropdownRef}
      className={`absolute ${getDropdownPosition()} bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 z-50 max-h-[80vh] overflow-hidden`}
    >
      {/* Search Header */}
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

      {/* Search Results */}
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
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={18} />
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

  const renderNotificationsDropdown = () => (
    <div 
      ref={dropdownRef}
      className={`absolute ${getDropdownPosition()} bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 z-50 max-h-[80vh] overflow-hidden`}
    >
      {/* Notifications Header */}
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
        <p className="text-gray-500 text-sm">Your recent activities</p>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="py-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <Bell size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm">
                    <span className="font-medium">{notification.user}</span> {notification.message}
                  </p>
                  <p className="text-gray-400 text-xs">{notification.time}</p>
                </div>
              </div>
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

      {/* Notifications Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-white sticky bottom-0">
          <button 
            onClick={() => navigate('/notifications')}
            className="w-full text-center text-purple-600 hover:text-purple-700 text-sm font-medium py-2"
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="hidden md:flex flex-col items-center py-6 h-[calc(100vh-30px)] fixed left-2 top-4 bottom-4 w-16 bg-blue-900 shadow-2xl rounded-3xl border border-blue-700 z-40">
      <ul className="flex flex-col items-center space-y-3 mt-2">
        {menu.map((item, index) => (
          <li
            key={index}
            className={`
              group
              w-10 h-10 
              flex items-center justify-center 
              rounded-xl 
              transition-all cursor-pointer relative
              ${location.pathname === item.path 
                ? 'bg-yellow-400 text-gray-900' 
                : 'text-white hover:bg-yellow-400 hover:text-gray-900'
              }
              ${(item.label === "Search" && activeDropdown === 'search') || 
                (item.label === "Notifications" && activeDropdown === 'notifications')
                ? 'bg-yellow-400 text-gray-900' 
                : ''
              }
            `}
            title={item.label}
            onClick={() => handleNavigation(item.path, item.label)}
          >
            {item.icon}
            
            {/* Notification Badge */}
            {item.label === "Notifications" && notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Dropdowns */}
      {activeDropdown === 'search' && renderSearchDropdown()}
      {activeDropdown === 'notifications' && renderNotificationsDropdown()}
    </div>
  );
};

export default SidebarLeft;