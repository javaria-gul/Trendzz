// frontend/src/components/ChatWindow.jsx

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
  Home
} from "lucide-react";
import { 
  getMessages, 
  markAsRead, 
  startChat, 
  getChats, 
  deleteChat 
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
  const [isOnline, setIsOnline] = useState(false);
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
              
              // Simulate online status
              setIsOnline(Math.random() > 0.5);
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
        alert("Failed to load chat");
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

    const handleNewMessage = (message) => {
      if (message.chatId === chatId) {
        setMessages(prev => {
          // Update sending message
          const updated = prev.map(msg => 
            msg.isSending && msg.text === message.text 
              ? { ...message, isSending: false }
              : msg
          );
          
          // Add new message if not present
          if (!updated.some(msg => msg._id === message._id)) {
            return [...updated, message];
          }
          return updated;
        });
      }
    };

    const handleTyping = (data) => {
      if (data.chatId === chatId && data.userId !== userData?._id) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
        
        // Clear after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }, 3000);
      }
    };

    const handleReadReceipt = (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => prev.map(msg => 
          msg.sender?._id !== userData?._id ? { ...msg, read: true } : msg
        ));
      }
    };

    const handleStopTyping = (data) => {
      if (data.chatId === chatId) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    };

    socket.on("receive_message", handleNewMessage);
    socket.on("user_typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("message_read", handleReadReceipt);

    return () => {
      socket.off("receive_message", handleNewMessage);
      socket.off("user_typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("message_read", handleReadReceipt);
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
      read: false,
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
      
      socket?.emit("stop_typing", { chatId, userId: userData?._id });
      
    } catch (error) {
      console.error("Send message error:", error);
      setMessages(prev => prev.map(msg => 
        msg._id === tempId 
          ? { ...msg, isSending: false, error: true, status: 'error' }
          : msg
      ));
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (socket && chatId) {
      socket.emit("typing", {
        chatId,
        userId: userData?._id
      });
    }
  };

  // Handle emoji select
  const handleEmojiSelect = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  // Handle delete chat - FIXED VERSION
  const handleDeleteChat = async () => {
    if (!chatId) return;
    
    if (window.confirm("Are you sure you want to delete this chat? All messages will be lost.")) {
      try {
        const response = await deleteChat(chatId);
        
        if (response.data?.success) {
          // ✅ DIRECT HOME FEED PE JANA HAI - BHAI KA REQUEST
          navigate('/', { replace: true });
        } else {
          alert("Chat delete nahi hui. Phir se try karein.");
        }
      } catch (error) {
        console.error("Delete chat error:", error);
        alert(`Error: ${error.response?.data?.message || "Chat delete nahi hui"}`);
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
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get message status icon
  const getMessageStatus = (message) => {
    if (message.isSending || message.status === 'sending') {
      return <Loader2 className="w-3 h-3 animate-spin" />;
    }
    if (message.read) {
      return <CheckCheck className="w-3 h-3 text-blue-300" />;
    }
    if (message.delivered || message.status === 'delivered') {
      return <CheckCheck className="w-3 h-3 opacity-60" />;
    }
    return <Check className="w-3 h-3 opacity-60" />;
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
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
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-12 h-12 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Welcome to Chat
          </h3>
          <p className="text-gray-500">
            Select a conversation or start a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    // ✅ EQUAL SPACING FOR ALL SIDES - MAIN CONTAINER
    <div className="h-screen w-full flex flex-col bg-white">
      {/* Header - TOP-RIGHT CROSS BUTTON ADDED HERE */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center">
          {/* Left side: User profile */}
          <div 
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleProfileClick}
          >
            <div className="relative">
              {otherUser?.profilePicture ? (
                <img 
                  src={otherUser.profilePicture} 
                  alt={otherUser.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {otherUser?.name?.charAt(0) || 'U'}
                </div>
              )}
              {/* Online status indicator */}
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            
            <div className="ml-3">
              <h3 className="font-semibold text-gray-800">
                {otherUser?.name || 'User'}
              </h3>
              <div className="flex items-center">
                <p className="text-xs text-gray-500">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
                {typingUsers.length > 0 && (
                  <span className="ml-2 text-xs text-blue-500 italic">
                    typing...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: CROSS BUTTON AND MENU */}
        <div className="flex items-center gap-2">
          {/* ✅ TOP-RIGHT CROSS BUTTON - BHAI KA SPECIFIC REQUEST */}
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-red-50 rounded-full transition-all duration-200 group"
            title="Go to Home Feed"
          >
            <X className="w-5 h-5 text-gray-500 group-hover:text-red-600" />
          </button>
          
          {/* Three dots menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={handleDeleteChat}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Delete Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container - EQUAL PADDING ALL SIDES */}
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
          <div className="space-y-3 max-w-4xl mx-auto">
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
                  } ${msg.error ? 'bg-red-100 border-red-200' : ''}`}
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

      {/* Message Input - EQUAL PADDING ALL SIDES */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
        <div className="relative max-w-4xl mx-auto">
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