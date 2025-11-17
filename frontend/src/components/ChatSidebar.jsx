import React, { useState, useEffect } from "react";
import { Search, MessageSquare, Users } from "lucide-react";

const ChatSidebar = () => {
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for now
  useEffect(() => {
    const mockChats = [
      {
        _id: "1",
        participants: [
          { _id: "2", name: "John Doe", username: "johndoe", avatar: "", online: true }
        ],
        lastMessage: {
          text: "Hey, how are you doing?",
          createdAt: new Date(Date.now() - 300000)
        },
        unreadCount: 2
      },
      {
        _id: "2",
        participants: [
          { _id: "3", name: "Sarah Smith", username: "sarah", avatar: "", online: false }
        ],
        lastMessage: {
          text: "Thanks for the help!",
          createdAt: new Date(Date.now() - 3600000)
        },
        unreadCount: 0
      }
    ];
    setChats(mockChats);
  }, []);

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
          <button className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No conversations yet</h3>
            <p className="text-gray-400 text-sm">Start a conversation with someone to see it here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {chats.map((chat) => (
              <div
                key={chat._id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
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
                    <p className="text-gray-500 text-sm truncate">
                      {chat.lastMessage.text}
                    </p>
                  </div>

                  {/* Unread Badge */}
                  {chat.unreadCount > 0 && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
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
  );
};

export default ChatSidebar;