import React, { useState, useEffect, useContext } from "react";
import { MessageSquare, Users } from "lucide-react";
import { getChats } from "../services/chat";
import { SocketContext } from "../context/SocketContext";
import { AuthContext } from "../context/AuthContext";
import SearchComponent from "./Search/SearchComponent";

const ChatSidebar = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const { socket } = useContext(SocketContext);
  const { userData } = useContext(AuthContext);

  // Fetch real chats
  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await getChats();
      if (response.data.success) {
        setChats(response.data.data);
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
    return participants.find(participant => participant._id !== userData?._id);
  };

  const getUnreadCount = (chat) => {
    return chat.unreadCounts?.get?.(userData?._id) || 0;
  };

  const handleUserSelect = (chat) => {
    // Redirect to the new chat
    window.location.href = `/chat/${chat._id}`;
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
        
        {/* Search Component for Chat */}
        <SearchComponent 
          mode="chat" 
          onUserSelect={handleUserSelect}
        />
      </div>

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
            <p className="text-gray-400 text-sm">Use the search bar above to start a conversation.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {chats.map((chat) => {
              const otherUser = getOtherParticipant(chat.participants);
              const unreadCount = getUnreadCount(chat);
              
              return (
                <div
                  key={chat._id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => window.location.href = `/chat/${chat._id}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {otherUser?.name?.charAt(0) || "U"}
                      </div>
                      {otherUser?.onlineStatus === "online" && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-800 text-sm truncate">
                          {otherUser?.name || "Unknown User"}
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
    </div>
  );
};

export default ChatSidebar;