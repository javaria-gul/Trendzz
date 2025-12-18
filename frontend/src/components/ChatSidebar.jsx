// src/components/ChatSidebar.jsx
import React, { useState, useEffect, useContext } from "react";
import { Search, MessageSquare, Users, ArrowLeft } from "lucide-react";
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
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  const { socket } = useContext(SocketContext);
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  // Calculate total unread count
  const calculateTotalUnread = () => {
    if (!chats.length || !userData?._id) return 0;
    
    let total = 0;
    chats.forEach(chat => {
      // Handle both Map and object types for unreadCounts
      if (chat.unreadCounts && chat.unreadCounts.get) {
        // It's a Map
        total += chat.unreadCounts.get(userData._id.toString()) || 0;
      } else if (chat.unreadCounts && typeof chat.unreadCounts === 'object') {
        // It's a plain object
        total += chat.unreadCounts[userData._id.toString()] || 0;
      } else if (chat.unreadCount !== undefined) {
        // Direct unreadCount property
        total += chat.unreadCount || 0;
      }
    });
    
    return total;
  };

  // Calculate users with unread messages
  const calculateUsersWithUnread = () => {
    if (!chats.length || !userData?._id) return 0;
    
    let usersWithUnread = 0;
    chats.forEach(chat => {
      let unreadCount = 0;
      
      if (chat.unreadCounts && chat.unreadCounts.get) {
        unreadCount = chat.unreadCounts.get(userData._id.toString()) || 0;
      } else if (chat.unreadCounts && typeof chat.unreadCounts === 'object') {
        unreadCount = chat.unreadCounts[userData._id.toString()] || 0;
      } else if (chat.unreadCount !== undefined) {
        unreadCount = chat.unreadCount || 0;
      }
      
      if (unreadCount > 0) {
        usersWithUnread++;
      }
    });
    
    return usersWithUnread;
  };

  // Helper to get unread count for a chat
  const getUnreadCount = (chat) => {
    if (!chat || !userData?._id) return 0;
    
    // Check different formats of unreadCounts
    if (chat.unreadCounts && chat.unreadCounts.get) {
      return chat.unreadCounts.get(userData._id.toString()) || 0;
    }
    
    if (chat.unreadCounts && typeof chat.unreadCounts === 'object') {
      return chat.unreadCounts[userData._id.toString()] || 0;
    }
    
    if (chat.unreadCount !== undefined) {
      return chat.unreadCount || 0;
    }
    
    return 0;
  };

  // Fetch real chats
  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await getChats();
      if (response.data.success) {
        const chats = response.data.data;
        setChats(chats);
        console.log('✅ Chats loaded:', chats.length);
        
        // Debug: Log unread counts
        chats.forEach(chat => {
          const unreadCount = getUnreadCount(chat);
          if (unreadCount > 0) {
            console.log(`📊 Chat ${chat._id} has ${unreadCount} unread messages`, chat.unreadCounts);
          }
        });
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

  // Listen for real-time chat updates - SAFE VERSION
  useEffect(() => {
    if (socket) {
      const handleChatUpdated = (data) => {
        console.log('🔄 Chat updated:', data);
        
        setChats(prevChats => {
          const existingChatIndex = prevChats.findIndex(chat => chat._id === data.chatId);
          
          if (existingChatIndex >= 0) {
            // Create a deep copy
            const updatedChats = JSON.parse(JSON.stringify(prevChats));
            const chatToUpdate = updatedChats[existingChatIndex];
            
            // Update last message
            if (data.lastMessage) {
              chatToUpdate.lastMessage = data.lastMessage;
            }
            
            // Update unread counts SAFELY - Convert Map to object if needed
            if (data.unreadCount !== undefined && userData?._id) {
              if (!chatToUpdate.unreadCounts) {
                chatToUpdate.unreadCounts = {};
              }
              
              // Convert Map to plain object if it's a Map
              if (chatToUpdate.unreadCounts instanceof Map || chatToUpdate.unreadCounts.get) {
                const plainObject = {};
                chatToUpdate.unreadCounts.forEach((value, key) => {
                  plainObject[key] = value;
                });
                chatToUpdate.unreadCounts = plainObject;
              }
              
              // Now safely set the value
              chatToUpdate.unreadCounts[userData._id.toString()] = data.unreadCount;
            }
            
            // Update timestamp
            chatToUpdate.updatedAt = new Date().toISOString();
            
            // Sort by updatedAt
            return updatedChats.sort((a, b) => 
              new Date(b.updatedAt) - new Date(a.updatedAt)
            );
          }
          
          return prevChats;
        });
      };

      const handleMessageDeleted = (data) => {
        console.log('🗑️ Message deleted in sidebar:', data);
        
        if (data.deleteType === 'forEveryone' && data.chatId) {
          // Update chat to reflect deleted message
          setChats(prevChats => {
            const chatIndex = prevChats.findIndex(chat => 
              chat._id === data.chatId || chat._id.toString() === data.chatId.toString()
            );
            
            if (chatIndex >= 0) {
              // Deep copy the chats array
              const updatedChats = [...prevChats];
              const chatToUpdate = { ...updatedChats[chatIndex] };
              
              // If lastMessage is provided in socket data, use it (already has deleted text)
              if (data.lastMessage) {
                chatToUpdate.lastMessage = data.lastMessage;
                console.log('✅ Updated last message with socket data:', data.lastMessage.text);
              } 
              // Otherwise check if current lastMessage matches deleted messageId
              else if (chatToUpdate.lastMessage) {
                const lastMsgId = typeof chatToUpdate.lastMessage === 'object' 
                  ? chatToUpdate.lastMessage._id 
                  : chatToUpdate.lastMessage;
                  
                if (lastMsgId === data.messageId || lastMsgId?.toString() === data.messageId?.toString()) {
                  // Update the message object to show deleted state
                  chatToUpdate.lastMessage = {
                    ...chatToUpdate.lastMessage,
                    deleted: true,
                    text: 'This message was deleted'
                  };
                  console.log('✅ Marked last message as deleted manually');
                }
              }
              
              updatedChats[chatIndex] = chatToUpdate;
              return updatedChats;
            }
            
            return prevChats;
          });
        }
      };

      socket.on("chat_updated", handleChatUpdated);
      socket.on("message_deleted", handleMessageDeleted);

      return () => {
        socket.off("chat_updated", handleChatUpdated);
        socket.off("message_deleted", handleMessageDeleted);
      };
    }
  }, [socket, userData]);

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
        // Filter out current user
        const filteredResults = response.data.data.filter(user => 
          user._id !== userData?._id
        );
        setSearchResults(filteredResults);
        setShowSearchResults(true);
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
      const response = await startChat(user._id);
      if (response.data.success) {
        const newChat = response.data.data;
        setChats(prev => [newChat, ...prev]);
        navigate(`/chat/${newChat._id}`);
        setSearchQuery("");
        setShowSearchResults(false);
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

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const getOtherParticipant = (participants) => {
    if (!participants || !Array.isArray(participants)) return null;
    return participants.find(participant => participant._id !== userData?._id);
  };

  // Get last message preview
  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return "Start a conversation";
    
    let preview = chat.lastMessage.text || "";
    
    if (chat.lastMessage.messageType === 'image') {
      preview = "📷 Image";
    } else if (chat.lastMessage.messageType === 'file') {
      preview = "📎 File";
    }
    
    if (chat.lastMessage.sender?._id === userData?._id) {
      return `You: ${preview}`;
    }
    
    return preview;
  };

  const totalUnread = calculateTotalUnread();
  const usersWithUnread = calculateUsersWithUnread();

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Messages
          </h2>
          {/* CHANGED: Plus button replaced with Left Arrow button */}
          <button 
            onClick={() => navigate('/')}
            className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors duration-200 shadow-sm"
            title="Go to Home"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
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
              const lastMessagePreview = getLastMessagePreview(chat);
              
              if (!otherUser) return null;
              
              return (
                <div
                  key={chat._id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors relative"
                  onClick={() => navigate(`/chat/${chat._id}`)}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with Unread Badge */}
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
                      
                      {/* Online Status */}
                      {otherUser.onlineStatus === "online" && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                      
                      {/* Unread Message Badge - RED CIRCLE with count */}
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          <span className="text-white text-xs font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-800 text-sm truncate">
                          {otherUser.name || "Unknown User"}
                        </h4>
                        <span className="text-xs text-gray-400">
                          {formatTime(chat.lastMessage?.createdAt || chat.updatedAt)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${
                        unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'
                      }`}>
                        {lastMessagePreview}
                      </p>
                    </div>
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