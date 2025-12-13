// src/components/ChatWindow.jsx
import React, { useState, useRef, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Send, 
  X, 
  Smile, 
  MoreVertical, 
  Check, 
  CheckCheck,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { 
  getMessages, 
  markAsRead, 
  startChat, 
  getChats
} from "../services/chat";
import { SocketContext } from "../context/SocketContext";
import { AuthContext } from "../context/AuthContext";
import EmojiPicker from 'emoji-picker-react';

const ChatWindow = () => {
  const { chatId, userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { socket } = useContext(SocketContext);
  const { userData } = useContext(AuthContext);

  // Debug on mount
  useEffect(() => {
    console.log("ChatWindow Mounted:", { chatId, userId });
  }, []);

  // Load chat function
  useEffect(() => {
    const loadChat = async () => {
      setLoading(true);
      
      try {
        // Start new chat
        if (userId && !chatId) {
          const response = await startChat(userId);
          if (response.data?.success) {
            const newChat = response.data.data;
            navigate(`/chat/${newChat._id}`, { replace: true });
            return;
          }
        }
        
        // Load existing chat
        if (chatId) {
          // Get chat details
          const chatsResponse = await getChats();
          if (chatsResponse.data?.success) {
            const chatList = chatsResponse.data.data || [];
            const foundChat = chatList.find(c => c._id === chatId);
            if (foundChat) {
              setChat(foundChat);
              
              // Find other user
              const other = foundChat.participants?.find(p => p._id !== userData?._id);
              setOtherUser(other);
            }
          }
          
          // Get messages
          const messagesResponse = await getMessages(chatId);
          if (messagesResponse.data?.success) {
            const loadedMessages = messagesResponse.data.data || [];
            setMessages(loadedMessages);
            
            // Mark as read
            await markAsRead(chatId);
          }
        }
        
      } catch (error) {
        console.error("Chat load error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (chatId || userId) {
      loadChat();
    } else {
      setLoading(false);
    }
  }, [chatId, userId, navigate, userData]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleNewMessage = (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => {
          // Check if message already exists
          const messageExists = prev.some(msg => msg._id === data.message._id);
          if (messageExists) return prev;
          
          return [...prev, data.message];
        });
      }
    };

    const handleTyping = (data) => {
      if (data.chatId === chatId && data.userId !== userData?._id) {
        setTypingUsers(prev => [...prev, data.userId]);
        
        // Clear after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }, 3000);
      }
    };

    const handleStopTyping = (data) => {
      if (data.chatId === chatId) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    };

    // Message status events
    const handleMessageSent = (data) => {
      if (data.chatId === chatId && data.tempId) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.tempId ? { ...msg, _id: data.messageId, status: 'sent', isSending: false } : msg
        ));
      }
    };

    const handleMessageDelivered = (data) => {
      if (data.chatId === chatId && data.messageId) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId ? { ...msg, status: 'delivered' } : msg
        ));
      }
    };

    const handleMessageRead = (data) => {
      if (data.chatId === chatId && data.messageId) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId ? { ...msg, status: 'read' } : msg
        ));
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);
    socket.on("message_sent", handleMessageSent);
    socket.on("message_delivered", handleMessageDelivered);
    socket.on("message_read", handleMessageRead);

    // Join chat room
    socket.emit("join_chat", { chatId });

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
      socket.off("message_sent", handleMessageSent);
      socket.off("message_delivered", handleMessageDelivered);
      socket.off("message_read", handleMessageRead);
      
      // Leave chat room
      socket.emit("leave_chat", { chatId });
    };
  }, [socket, chatId, userData]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || sending) return;
    
    setSending(true);
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      sender: userData,
      text: newMessage.trim(),
      createdAt: new Date().toISOString(),
      isSending: true,
      status: 'sending'
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");
    setShowEmojiPicker(false);
    
    try {
      if (socket) {
        socket.emit("send_message", {
          chatId,
          text: newMessage.trim(),
          messageType: "text",
          tempId
        });
      }
      
      socket?.emit("typing_stop", { chatId });
      
    } catch (error) {
      console.error("Send message error:", error);
      setMessages(prev => prev.map(msg => 
        msg._id === tempId 
          ? { ...msg, isSending: false, status: 'error' }
          : msg
      ));
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (socket && chatId) {
      socket.emit("typing_start", { chatId });
    }
  };

  // Handle emoji select
  const handleEmojiSelect = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  // Handle delete chat
  const handleDeleteChat = async () => {
    if (!chatId) return;
    
    if (window.confirm("Are you sure you want to delete this chat?")) {
      try {
        navigate('/');
      } catch (error) {
        console.error("Delete chat error:", error);
      }
    }
    setShowMenu(false);
  };

  // Navigate to user profile
  const handleProfileClick = () => {
    if (otherUser) {
      navigate(`/profile/${otherUser._id}`);
    }
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format last seen
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Recently";
    
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diff = now - lastSeen;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Get message status icon
  const getMessageStatus = (message) => {
    if (message.isSending || message.status === 'sending') {
      return <Loader2 className="w-3 h-3 animate-spin text-gray-400" />;
    }
    
    if (message.status === 'read') {
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    }
    
    if (message.status === 'delivered') {
      return <CheckCheck className="w-3 h-3 text-gray-400" />;
    }
    
    if (message.status === 'sent') {
      return <Check className="w-3 h-3 text-gray-400" />;
    }
    
    return <Check className="w-3 h-3 text-gray-300" />;
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!chatId && !userId) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-12 h-12 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Your Messages
          </h3>
          <p className="text-gray-500">
            Send private messages to start conversations with other users on the platform.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-gray-200 bg-white flex items-center">
        {/* Back button for mobile */}
        <button
          onClick={() => navigate('/chat')}
          className="md:hidden mr-3 p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        {/* User info */}
        <button 
          onClick={handleProfileClick}
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity group flex-1"
        >
          <div className="relative">
            {/* User Profile Picture */}
            {otherUser?.avatar ? (
              <img 
                src={otherUser.avatar} 
                alt={otherUser.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            
            {/* Online Status Indicator */}
            {otherUser?.onlineStatus === 'online' && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          
          {/* User Info */}
          <div className="ml-3 text-left">
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
              {otherUser?.name || 'Unknown User'}
            </h3>
            <div className="flex items-center">
              <p className="text-xs text-gray-500">
                {otherUser?.onlineStatus === 'online' ? 'Online' : 
                 otherUser?.lastSeen ? `Last seen ${formatLastSeen(otherUser.lastSeen)}` : 'Offline'}
              </p>
              {typingUsers.length > 0 && (
                <span className="ml-2 text-xs text-blue-500 italic">
                  typing...
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Right side buttons - UPDATED WITH RED CROSS */}
        <div className="flex items-center gap-2">
          {/* Red Cross Button - Close chat */}
          <button
            onClick={() => {
              // Navigate to chat page without any chat selected
              navigate('/chat');
            }}
            className="p-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-full transition-colors duration-200 shadow-sm"
            title="Close chat"
          >
            <X className="w-5 h-5 text-red-500" />
          </button>
          
          {/* Three dots menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              title="More options"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={handleDeleteChat}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center transition-colors duration-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Delete Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-400 text-sm">
              Send your first message to {otherUser?.name || 'this user'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <div
                key={msg._id || index}
                className={`flex ${msg.sender?._id === userData?._id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs sm:max-w-sm md:max-w-md px-4 py-3 rounded-2xl ${
                    msg.sender?._id === userData?._id
                      ? 'bg-blue-500 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                  } ${msg.status === 'error' ? 'bg-red-100 border-red-200' : ''}`}
                >
                  <p className="text-sm sm:text-base break-words">{msg.text}</p>
                  
                  <div className={`flex items-center justify-end mt-1 text-xs ${
                    msg.sender?._id === userData?._id ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span className="mr-2">{formatTime(msg.createdAt)}</span>
                    
                    {msg.sender?._id === userData?._id && (
                      <span className="flex items-center">
                        {getMessageStatus(msg)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
        <div className="relative">
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="emoji-picker-container absolute bottom-full right-0 mb-2 z-50">
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                width={300}
                height={350}
              />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {/* Emoji Button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
            >
              <Smile className="w-5 h-5 text-gray-500" />
            </button>
            
            {/* Message Input */}
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              disabled={!chatId || sending}
            />
            
            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !chatId || sending}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;