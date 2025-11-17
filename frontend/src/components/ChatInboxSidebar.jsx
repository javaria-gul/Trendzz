import React, { useState, useEffect } from "react";
import { Search, MessageSquare, Users, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ChatInboxSidebar = () => {
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const navigate = useNavigate();

  // Mock data - Replace with real API
  useEffect(() => {
    const mockChats = [
      {
        _id: "1",
        participants: [
          { _id: "2", name: "John Doe", username: "johndoe", avatar: "", online: true }
        ],
        lastMessage: {
          text: "Hey, how are you doing?",
          createdAt: new Date(Date.now() - 300000),
          sender: "2",
          read: false
        },
        unreadCount: 2,
        updatedAt: new Date(Date.now() - 300000)
      },
      {
        _id: "2",
        participants: [
          { _id: "3", name: "Sarah Smith", username: "sarah", avatar: "", online: false }
        ],
        lastMessage: {
          text: "Thanks for the help with the project!",
          createdAt: new Date(Date.now() - 3600000),
          sender: "1",
          read: true
        },
        unreadCount: 0,
        updatedAt: new Date(Date.now() - 3600000)
      },
      {
        _id: "3",
        participants: [
          { _id: "4", name: "Mike Johnson", username: "mikej", avatar: "", online: true }
        ],
        lastMessage: {
          text: "Let's meet tomorrow",
          createdAt: new Date(Date.now() - 86400000),
          sender: "4",
          read: true
        },
        unreadCount: 0,
        updatedAt: new Date(Date.now() - 86400000)
      }
    ];

    const mockOnlineUsers = [
      { _id: "5", name: "Alex Brown", username: "alexb", avatar: "", mutualFriends: 3 },
      { _id: "6", name: "Emma Wilson", username: "emmaw", avatar: "", mutualFriends: 5 },
      { _id: "7", name: "David Lee", username: "davidl", avatar: "", mutualFriends: 2 }
    ];

    setChats(mockChats);
    setOnlineUsers(mockOnlineUsers);
  }, []);

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const startNewChat = (userId) => {
    navigate(`/chat/new/${userId}`);
  };

  const openChat = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
          <button 
            onClick={() => navigate('/chat/new')}
            className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
            title="New Message"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Online Users Quick Access */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Online Now</h3>
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {onlineUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => startNewChat(user._id)}
              className="flex flex-col items-center space-y-2 flex-shrink-0"
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <span className="text-xs text-gray-600 max-w-12 truncate">{user.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
              <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No conversations yet</h3>
              <p className="text-gray-400 text-sm">Start a conversation to see it here.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => openChat(chat._id)}
                  className="p-3 hover:bg-blue-50 cursor-pointer transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with Online Status */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {chat.participants[0].name.charAt(0)}
                      </div>
                      {chat.participants[0].online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-800 text-sm truncate">
                          {chat.participants[0].name}
                        </h4>
                        <span className="text-xs text-gray-400">
                          {formatTime(chat.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${chat.lastMessage.sender !== '1' && !chat.lastMessage.read ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                          {chat.lastMessage.sender === '1' && 'You: '}
                          {chat.lastMessage.text}
                        </p>
                        {chat.lastMessage.sender !== '1' && !chat.lastMessage.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </div>

                    {/* Unread Badge */}
                    {chat.unreadCount > 0 && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">
                          {chat.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInboxSidebar;