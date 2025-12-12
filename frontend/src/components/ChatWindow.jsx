import React, { useState, useRef, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Image, Paperclip, Smile, MoreVertical, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { getMessages, markAsRead, startChat, getChats } from "../services/chat";
import { SocketContext } from "../context/SocketContext";
import { AuthContext } from "../context/AuthContext";

const ChatWindow = () => {
  const { chatId, userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  
  const { socket } = useContext(SocketContext);
  const { userData } = useContext(AuthContext);

  // DEBUG: Check user data
  useEffect(() => {
    console.log("🔄 ChatWindow - Current UserData:", userData);
    console.log("🔄 ChatWindow - User ID:", userData?._id);
  }, [userData]);

  // Track temporary messages
  const tempMessagesRef = useRef(new Set());

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      setLoading(true);
      setMessages([]);
      tempMessagesRef.current.clear();
      
      try {
        let currentChatId = chatId;
        
        if (userId && !chatId) {
          console.log('🆕 Starting new chat with user:', userId);
          const chatResponse = await startChat(userId);
          if (chatResponse.data.success) {
            currentChatId = chatResponse.data.data._id;
            setChat(chatResponse.data.data);
            navigate(`/chat/${currentChatId}`, { replace: true });
          }
        } else if (chatId) {
          const chatsResponse = await getChats();
          if (chatsResponse.data.success) {
            const currentChat = chatsResponse.data.data.find(c => c._id === chatId);
            setChat(currentChat);
          }
        }
        
        if (currentChatId) {
          const messagesResponse = await getMessages(currentChatId);
          if (messagesResponse.data.success) {
            setMessages(messagesResponse.data.data);
            await markAsRead(currentChatId);
          }
        }
        
      } catch (error) {
        console.error("Error initializing chat:", error);
        alert(error.response?.data?.message || "Failed to load chat");
      } finally {
        setLoading(false);
      }
    };

    if (chatId || userId) {
      initializeChat();
    }
  }, [chatId, userId, navigate]);

  // Socket listeners
  useEffect(() => {
    if (socket && chatId) {
      socket.emit("join_chat", chatId);
      
      const handleNewMessage = (data) => {
        if (data.chatId === chatId) {
          console.log('📨 Real message received via socket:', data.message);
          console.log('👤 Message Sender ID:', data.message.sender._id);
          console.log('👤 Current User ID:', userData?._id);
          
          setMessages(prev => {
            // Check if this message text matches any temporary message
            const tempMessageToReplace = prev.find(msg => 
              msg.isSending && msg.text === data.message.text
            );

            if (tempMessageToReplace) {
              console.log('🔄 Replacing temporary message with real one');
              tempMessagesRef.current.delete(tempMessageToReplace._id);
              return prev.map(msg => 
                msg._id === tempMessageToReplace._id ? data.message : msg
              );
            }

            // Check if message already exists
            const messageExists = prev.some(msg => msg._id === data.message._id);
            if (messageExists) {
              console.log('⚠️ Message already exists, skipping');
              return prev;
            }
            
            console.log('✅ Adding new message from other user');
            return [...prev, data.message];
          });
          
          markAsRead(chatId);
        }
      };

      const handleUserTyping = (data) => {
        if (data.chatId === chatId && data.userId !== userData?._id) {
          setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
        }
      };

      const handleUserStopTyping = (data) => {
        if (data.chatId === chatId) {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }
      };

      socket.on("new_message", handleNewMessage);
      socket.on("user_typing", handleUserTyping);
      socket.on("user_stop_typing", handleUserStopTyping);

      return () => {
        socket.emit("leave_chat", chatId);
        socket.off("new_message", handleNewMessage);
        socket.off("user_typing", handleUserTyping);
        socket.off("user_stop_typing", handleUserStopTyping);
      };
    }
  }, [socket, chatId, userData]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Typing indicators
  const handleTypingStart = () => {
    if (socket && chatId) {
      socket.emit("typing_start", { chatId });
    }
  };

  const handleTypingStop = () => {
    if (socket && chatId) {
      socket.emit("typing_stop", { chatId });
    }
  };

  // Send message - FIXED VERSION
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !userData) {
      console.log('❌ Cannot send message - missing data:', { 
        hasMessage: !!newMessage.trim(), 
        hasChatId: !!chatId, 
        hasUserData: !!userData 
      });
      return;
    }

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;

    try {
      // Create temporary message (optimistic update)
      const tempMessage = {
        _id: tempId,
        sender: { 
          _id: userData._id, 
          name: userData.name, 
          username: userData.username, 
          avatar: userData.avatar 
        },
        text: messageText,
        createdAt: new Date(),
        readBy: [],
        isSending: true
      };

      console.log('📤 Sending message via socket, temp ID:', tempId);
      console.log('👤 Sender ID in temp message:', userData._id);
      
      // Track this temporary message
      tempMessagesRef.current.add(tempId);
      
      // Add to UI immediately
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage("");
      handleTypingStop();

      // Send via socket
      if (socket) {
        socket.emit("send_message", {
          chatId,
          text: messageText,
          messageType: "text"
        });
        console.log('✅ Message sent via socket');
      }

      // Safety cleanup
      setTimeout(() => {
        if (tempMessagesRef.current.has(tempId)) {
          console.log('🕒 Removing temporary message after timeout');
          setMessages(prev => prev.filter(msg => msg._id !== tempId));
          tempMessagesRef.current.delete(tempId);
        }
      }, 10000);

    } catch (error) {
      console.error("❌ Error sending message:", error);
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      tempMessagesRef.current.delete(tempId);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get message status icon
  const getMessageStatus = (message) => {
    if (message.isSending) {
      return <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-1" />;
    }
    
    if (message.readBy && message.readBy.length > 1) {
      return <CheckCheck className="w-3 h-3 text-blue-500 ml-1" />;
    }
    
    return <Check className="w-3 h-3 text-gray-400 ml-1" />;
  };

  // Message display with better debugging
  const renderMessage = (message) => {
    // EXTENSIVE DEBUGGING
    console.log('🔍 === MESSAGE DEBUG START ===');
    console.log('💬 Message Object:', JSON.stringify(message, null, 2));
    console.log('👤 Message Sender:', message.sender);
    console.log('🆔 Message Sender ID:', message.sender?._id, 'Type:', typeof message.sender?._id);
    console.log('👤 Current User:', userData);
    console.log('🆔 Current User ID:', userData?._id, 'Type:', typeof userData?._id);
    
    // Multiple comparison methods
    const comparison1 = message.sender?._id === userData?._id;
    const comparison2 = message.sender?._id?.toString() === userData?._id?.toString();
    const comparison3 = String(message.sender?._id) === String(userData?._id);
    
    console.log('🔀 Comparisons:', {
      direct: comparison1,
      toString: comparison2, 
      String: comparison3
    });
    
    console.log('🔍 === MESSAGE DEBUG END ===');
    
    // Use the most reliable comparison
    const isCurrentUser = String(message.sender?._id) === String(userData?._id);

    return (
      <div
        key={message._id}
        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
      >
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
          isCurrentUser 
            ? "bg-blue-500 text-white rounded-br-none" 
            : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
        } ${message.isSending ? "opacity-80" : ""}`}>
          <p className="text-sm">
            {message.text}
            <span className="text-xs ml-2 opacity-70">
              ({isCurrentUser ? 'YOU' : 'THEM'})
              <br/>
              Sender: {message.sender?._id?.toString().substring(0, 8)}...
              <br/>
              Current: {userData?._id?.toString().substring(0, 8)}...
            </span>
          </p>
          <div className={`flex items-center justify-end mt-1 ${
            isCurrentUser ? "text-blue-100" : "text-gray-400"
          }`}>
            <span className="text-xs">
              {new Date(message.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            {isCurrentUser && getMessageStatus(message)}
          </div>
        </div>
      </div>
    );
  };

  // Get the other participant info
  const getOtherParticipant = () => {
    if (chat?.participants) {
      return chat.participants.find(participant => participant._id !== userData?._id);
    }
    return null;
  };

  const otherUser = getOtherParticipant();

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3">
        <button 
          onClick={() => navigate('/chat')}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        
        {otherUser ? (
          <>
            <div className="relative">
              {otherUser.avatar ? (
                <img 
                  src={otherUser.avatar} 
                  alt={otherUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {otherUser.name?.charAt(0) || "U"}
                </div>
              )}
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                otherUser.onlineStatus === 'online' ? 'bg-green-500' : 'bg-gray-400'
              }`}></span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{otherUser.name}</h3>
              <p className="text-sm text-gray-500">@{otherUser.username}</p>
            </div>
          </>
        ) : (
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">
              {loading ? "Starting chat..." : "Chat"}
            </h3>
          </div>
        )}
        
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No messages yet</h3>
            <p className="text-gray-400 text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map(renderMessage)}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Image className="w-5 h-5 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (e.target.value.trim()) {
                  handleTypingStart();
                } else {
                  handleTypingStop();
                }
              }}
              onKeyPress={handleKeyPress}
              onBlur={handleTypingStop}
              placeholder="Type a message..."
              rows="1"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"
            />
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Smile className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !chatId}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;