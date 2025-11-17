import React from "react";
import { Outlet } from "react-router-dom";
import ChatSidebar from "./ChatSidebar";
import { MessageCircle } from "lucide-react";

const ChatLayout = () => {
  return (
    <div className="flex h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Chat List Sidebar - 400px fixed width */}
      <div className="w-full md:w-96 border-r border-gray-200">
        <ChatSidebar />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 hidden md:block">
        <Outlet />
      </div>
      
      {/* Empty State for Mobile */}
      <div className="flex-1 hidden">
        <div className="h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">Select a conversation</h3>
            <p className="text-gray-400">Choose from your existing chats or start a new one</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;