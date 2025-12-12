import React, { useState, useRef, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Image, Paperclip, Smile, MoreVertical, ArrowLeft } from "lucide-react";
import { getMessages, sendMessage, markAsRead } from "../services/chat";
import { SocketContext } from "../context/SocketContext";
import { AuthContext } from "../context/AuthContext";

const ChatWindow = () => {
  const { chatId, userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  
  const { socket } = useContext(SocketContext);
  const { userData } = useContext(AuthContext);

  // Fetch messages for the chat
  const fetchMessages = async () => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      const response = await getMessages(chatId);
      if (response.data.success) {
        setMessages(response.data.data);
        
        // Mark messages as read
        await markAsRead(chatId);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Join chat room and setup socket listeners
  useEffect(() => {
    if (socket && chatId) {
      // Join the chat room
      socket.emit("join_chat", chatId);
      
      // Listen for new messages
      socket.on("new_message", (data) => {
        if (data.chatId === chatId) {
          setMessages(prev => [...prev, data.message]);
          markAsRead(chatId); // Mark as read when new message arrives
        }
      });

      // Listen for typing events
      socket.on("user_typing", (data) => {
        if (data.chatId === chatId && data.userId !== userData?._id) {
          setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
        }
      });

      socket.on("user_stop_typing", (data) => {
        if (data.chatId === chatId) {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }
      });

      // Listen for message reactions
      socket.on("message_reacted", (data) => {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, reactions: data.reactions }
              : msg
          )
        );
      });

      return () => {
        socket.emit("leave_chat", chatId);
        socket.off("new_message");
        socket.off("user_typing");
        socket.off("user_stop_typing");
        socket.off("message_reacted");
      };
    }
  }, [socket, chatId, userData]);

  // Fetch messages when chatId changes
  useEffect(() => {
    fetchMessages();
  }, [chatId]);

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

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId) return;

    const messageData = {
      text: newMessage.trim(),
      messageType: "text"
    };

    try {
      // Optimistically add message to UI
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        sender: { 
          _id: userData._id, 
          name: userData.name, 
          username: userData.username, 
          avatar: userData.avatar 
        },
        text: newMessage.trim(),
        createdAt: new Date(),
        readBy: [userData._id],
        isSending: true
      };

      setMessages(prev => [...prev, tempMessage]);
      setNewMessage("");
      handleTypingStop();

      // Send via socket for real-time
      if (socket) {
        socket.emit("send_message", {
          chatId,
          ...messageData
        });
      }

      // Also send via API for backup
      await sendMessage(chatId, messageData);

      // Remove temporary flag
      setMessages(prev => 
        prev.map(msg => 
          msg.isSending ? { ...msg, isSending: false } : msg
        )
      );

    } catch (error) {
      console.error("Error sending message:", error);
      // Remove failed message
      setMessages(prev => prev.filter(msg => !msg.isSending));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherParticipant = () => {
    if (!chat?.participants) return null;
    return chat.participants.find(participant => participant._id !== userData?._id);
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
        
        {otherUser && (
          <>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {otherUser.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{otherUser.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${otherUser.onlineStatus === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                {otherUser.onlineStatus === 'online' ? 'Online' : 'Offline'}
              </p>
            </div>
          </>
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
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender._id === userData?._id ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender._id === userData?._id 
                    ? "bg-blue-500 text-white rounded-br-none" 
                    : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                } ${message.isSending ? "opacity-70" : ""}`}>
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender._id === userData?._id ? "text-blue-100" : "text-gray-400"
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    {message.isSending && " • Sending..."}
                  </p>
                </div>
              </div>
            ))}
            
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
            disabled={!newMessage.trim()}
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