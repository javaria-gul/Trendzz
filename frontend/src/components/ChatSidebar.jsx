import React, { useState, useEffect, useContext } from "react";
import { Search, MessageSquare, Users, Plus } from "lucide-react";
import { getChats, startChat } from "../services/chat";
import { searchUsers } from "../services/user";
import { SocketContext } from "../context/SocketContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ChatSidebar = () => {
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const { socket } = useContext(SocketContext);
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch real chats
  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await getChats();
      if (response.data.success) {
        setChats(response.data.data);
        console.log('✅ Chats loaded:', response.data.data.length);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // Listen for real-time chat updates
  useEffect(() => {
    if (socket) {
      socket.on("chat_updated", (data) => {
        console.log('🔄 Chat updated:', data);
        setChats(prevChats => {
          const existingChatIndex = prevChats.findIndex(chat => chat._id === data.chatId);
          
          if (existingChatIndex >= 0) {
            // Update existing chat
            const updatedChats = [...prevChats];
            updatedChats[existingChatIndex] = {
              ...updatedChats[existingChatIndex],
              lastMessage: data.lastMessage,
              unreadCounts: data.unreadCount
            };
            // Sort by updatedAt
            return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          } else {
            // This should not happen often, but fetch chats again if new chat
            fetchChats();
            return prevChats;
          }
        });
      });

      return () => {
        socket.off("chat_updated");
      };
    }
  }, [socket]);

  // Search users function
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await searchUsers(query);
      if (response.data.success) {
        setSearchResults(response.data.data || []);
        setShowSearchResults(true);
        console.log('🔍 Search results:', response.data.data);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Start new chat with user
  const handleStartChat = async (user) => {
    try {
      console.log('💬 Starting chat with:', user.name);
      const response = await startChat(user._id);
      if (response.data.success) {
        const newChat = response.data.data;
        // Add to chats list
        setChats(prev => [newChat, ...prev]);
        // Navigate to chat
        navigate(`/chat/${newChat._id}`);
        // Clear search
        setSearchQuery("");
        setShowSearchResults(false);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Start chat error:", error);
      alert(error.response?.data?.message || "Failed to start chat");
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getOtherParticipant = (participants) => {
    if (!participants || !Array.isArray(participants)) return null;
    return participants.find(participant => participant._id !== userData?._id);
  };

  const getUnreadCount = (chat) => {
    if (!chat.unreadCounts || typeof chat.unreadCounts.get !== 'function') return 0;
    return chat.unreadCounts.get(userData?._id) || 0;
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/chat')}
              className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
            >
              <Plus className="w-4 h-4 text-blue-600" />
            </button>
            <button className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users to message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showSearchResults && (
        <div className="absolute top-28 left-4 right-4 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50">
          {searchLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleStartChat(user)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.name?.charAt(0) || "U"}
                        </div>
                      )}
                      {user.onlineStatus === 'online' && (
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              No users found
            </div>
          ) : null}
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No conversations yet</h3>
            <p className="text-gray-400 text-sm mb-4">Start a conversation to see it here.</p>
            <p className="text-gray-400 text-sm">Use the search bar above to find users.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {chats.map((chat) => {
              const otherUser = getOtherParticipant(chat.participants);
              const unreadCount = getUnreadCount(chat);
              
              if (!otherUser) {
                console.log('❌ No other user found in chat:', chat);
                return null;
              }
              
              return (
                <div
                  key={chat._id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/chat/${chat._id}`)}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      {otherUser.avatar ? (
                        <img 
                          src={otherUser.avatar} 
                          alt={otherUser.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {otherUser.name?.charAt(0) || "U"}
                        </div>
                      )}
                      {otherUser.onlineStatus === "online" && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-800 text-sm truncate">
                          {otherUser.name || "Unknown User"}
                        </h4>
                        <span className="text-xs text-gray-400">
                          {formatTime(chat.lastMessage?.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm truncate">
                        {chat.lastMessage?.text || "Start a conversation"}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {unreadCount > 0 && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Overlay to close search results when clicking outside */}
      {showSearchResults && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowSearchResults(false)}
        />
      )}
    </div>
  );
};

export default ChatSidebar;