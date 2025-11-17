import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Send, Image, Paperclip, Smile, MoreVertical } from "lucide-react";

const ChatWindow = () => {
  const { chatId, userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Mock messages - Replace with real data
  useEffect(() => {
    if (chatId) {
      const mockMessages = [
        {
          _id: "1",
          sender: { _id: "2", name: "John Doe", username: "johndoe", avatar: "" },
          text: "Hey there! How are you doing?",
          createdAt: new Date(Date.now() - 3600000),
          read: true
        },
        {
          _id: "2", 
          sender: { _id: "1", name: "You", username: "you", avatar: "" },
          text: "I'm good! Working on the new project. How about you?",
          createdAt: new Date(Date.now() - 1800000),
          read: true
        },
        {
          _id: "3",
          sender: { _id: "2", name: "John Doe", username: "johndoe", avatar: "" },
          text: "That's great! I just finished my part. Let's catch up tomorrow.",
          createdAt: new Date(Date.now() - 600000),
          read: false
        }
      ];
      setMessages(mockMessages);
    }
  }, [chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        _id: Date.now().toString(),
        sender: { _id: "1", name: "You", username: "you", avatar: "" },
        text: newMessage,
        createdAt: new Date(),
        read: false
      };
      setMessages(prev => [...prev, message]);
      setNewMessage("");
      
      // TODO: Send via WebSocket
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            J
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">John Doe</h3>
            <p className="text-sm text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Online
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.sender._id === "1" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.sender._id === "1" 
                  ? "bg-blue-500 text-white rounded-br-none" 
                  : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
              }`}>
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender._id === "1" ? "text-blue-100" : "text-gray-400"
                }`}>
                  {new Date(message.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
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
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
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