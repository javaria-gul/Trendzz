// frontend/src/components/ChatWindow.jsx

import React, { useState, useRef, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { getMessages, markAsRead, startChat, getChats } from "../services/chat";
import { SocketContext } from "../context/SocketContext";
import { AuthContext } from "../context/AuthContext";

const ChatWindow = () => {
  const { chatId, userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  const { socket } = useContext(SocketContext);
  const { userData } = useContext(AuthContext);

  // **STEP 1: Check ALL data on mount**
  useEffect(() => {
    console.log("========== CHATWINDOW DEBUG ==========");
    console.log("🔍 URL Parameters:", { chatId, userId });
    console.log("👤 User Data:", userData);
    console.log("🔑 Token:", localStorage.getItem("trendzz_token"));
    console.log("🔌 Socket:", socket ? "Connected" : "Not connected");
    console.log("======================================");
  }, []);

  // **STEP 2: Simple chat load function**
  useEffect(() => {
    const loadChat = async () => {
      console.log("🚀 loadChat function triggered");
      setLoading(true);
      
      try {
        // Case A: Start new chat
        if (userId && !chatId) {
          console.log("🆕 Trying to start chat with user:", userId);
          
          // First test API connection
          try {
            const testResponse = await fetch("http://localhost:5000/api/auth/test-connection", {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem("trendzz_token")}`
              }
            });
            console.log("🌐 API Connection Test:", await testResponse.json());
          } catch (testError) {
            console.error("❌ API Connection Failed:", testError);
          }
          
          const response = await startChat(userId);
          console.log("📦 startChat RAW Response:", response);
          
          if (response.data?.success) {
            const newChat = response.data.data;
            console.log("✅ Chat created successfully:", newChat);
            navigate(`/chat/${newChat._id}`, { replace: true });
            return;
          } else {
            console.error("❌ startChat failed:", response.data);
            alert("Failed to start chat: " + (response.data?.message || "Unknown error"));
            navigate("/chat");
            return;
          }
        }
        
        // Case B: Load existing chat
        if (chatId) {
          console.log(`📂 Loading chat ${chatId}`);
          
          // Test 1: Get chats list
          console.log("📋 Fetching chats list...");
          const chatsResponse = await getChats();
          console.log("📦 getChats Response:", chatsResponse);
          
          if (chatsResponse.data?.success) {
            const chatList = chatsResponse.data.data || [];
            console.log(`📊 Found ${chatList.length} chats`);
            
            const foundChat = chatList.find(c => c._id === chatId);
            if (foundChat) {
              console.log("✅ Chat found:", foundChat);
              setChat(foundChat);
            } else {
              console.log(`⚠️ Chat ${chatId} not found in list`);
              setChat({ _id: chatId, participants: [] });
            }
          }
          
          // Test 2: Get messages
          console.log("💬 Fetching messages...");
          const messagesResponse = await getMessages(chatId);
          console.log("📦 getMessages Response:", messagesResponse);
          
          if (messagesResponse.data?.success) {
            const loadedMessages = messagesResponse.data.data || [];
            console.log(`✅ Loaded ${loadedMessages.length} messages`);
            setMessages(loadedMessages);
            
            // Mark as read
            try {
              await markAsRead(chatId);
              console.log("✅ Messages marked as read");
            } catch (error) {
              console.log("⚠️ Could not mark as read:", error.message);
            }
          }
        }
        
      } catch (error) {
        console.error("❌ Chat load ERROR:", error);
        console.error("Error Details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: error.config
        });
        
        // Show specific error message
        let errorMsg = "Failed to load chat. ";
        if (error.response?.status === 401) {
          errorMsg += "You are not logged in. Please login again.";
          localStorage.removeItem("trendzz_token");
          navigate("/login");
        } else if (error.response?.status === 404) {
          errorMsg += "Chat not found.";
        } else if (error.response?.data?.message) {
          errorMsg += error.response.data.message;
        } else if (error.message.includes("Network Error")) {
          errorMsg += "Cannot connect to server. Make sure backend is running.";
        }
        
        console.error("🚨 Error Message:", errorMsg);
        alert(errorMsg);
        
      } finally {
        setLoading(false);
        console.log("🏁 Chat load completed (loading set to false)");
      }
    };

    // Only load if we have chatId or userId
    if (chatId || userId) {
      console.log("✅ Conditions met, loading chat...");
      loadChat();
    } else {
      console.log("⚠️ No chatId or userId, skipping load");
      setLoading(false);
    }
  }, [chatId, userId, navigate]);

  // Auto-scroll
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message (simple)
  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatId) return;
    
    const tempMessage = {
      _id: `temp_${Date.now()}`,
      sender: userData,
      text: newMessage.trim(),
      createdAt: new Date().toISOString(),
      isSending: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");
    
    // Send via socket if available
    if (socket) {
      socket.emit("send_message", {
        chatId,
        text: newMessage.trim(),
        messageType: "text"
      });
    }
  };

  // **Render Loading State**
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500">Loading chat...</p>
          <p className="text-gray-400 text-sm mt-2">
            Chat ID: {chatId || "none"} | User ID: {userId || "none"}
          </p>
        </div>
      </div>
    );
  }

  // **Render Error/Empty State**
  if (!chatId && !userId) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white p-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Chat Selected
          </h3>
          <p className="text-gray-500 mb-6">
            Select a chat from the sidebar
          </p>
        </div>
      </div>
    );
  }

  // **Render Chat UI**
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center">
        <button
          onClick={() => navigate('/chat')}
          className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        
        <div className="ml-3">
          <h3 className="font-semibold text-gray-800">
            {chat ? "Chat" : "Loading..."}
          </h3>
          <p className="text-sm text-gray-500">
            {messages.length} messages
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Start the conversation
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, index) => (
              <div
                key={msg._id || index}
                className={`p-3 rounded-lg max-w-xs ${
                  msg.sender?._id === userData?._id
                    ? "bg-blue-500 text-white ml-auto"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {msg.isSending ? "Sending..." : "Sent"}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!chatId}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !chatId}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;