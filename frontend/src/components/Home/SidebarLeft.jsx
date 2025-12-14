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
} from "lucide-react";

const SidebarLeft = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // MENU - Search goes to /search page, Notifications is dropdown hahahaha
  const menu = [
    { label: "Home", icon: <Home size={20} />, path: "/" },
    { label: "Chat", icon: <MessageCircle size={20} />, path: "/chat" },
    { label: "Notifications", icon: <Bell size={20} />, path: "#" },
    { label: "Search", icon: <Search size={20} />, path: "/search" }, // Direct to search page
    { label: "Create Post", icon: <PlusCircle size={20} />, path: "/create-post" },
    { label: "Profile", icon: <User size={20} />, path: "/profile" },
    { label: "Settings", icon: <Settings size={20} />, path: "/settings" },
  
  ];

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
    // Handle dropdown items (only notifications now)
    if (path === "#") {
      if (label === "Notifications") {
        setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications');
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

  const renderNotificationsDropdown = () => (
    <div 
      ref={dropdownRef}
      className="absolute left-16 top-4 bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 z-50 max-h-[80vh] overflow-hidden"
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
              ${item.label === "Notifications" && activeDropdown === 'notifications'
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

      {/* Only notifications dropdown */}
      {activeDropdown === 'notifications' && renderNotificationsDropdown()}
    </div>
  );
};

export default SidebarLeft;