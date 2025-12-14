import React from "react";
import { Outlet } from "react-router-dom";
import ChatSidebar from "./ChatSidebar";

const ChatLayout = () => {
  return (
    <div className="h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mx-4 my-4">
      <div className="flex h-full">
        {/* Chat List Sidebar - 400px fixed width */}
        <div className="w-full md:w-96 border-r border-gray-200">
          <ChatSidebar />
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 hidden md:block">
          <Outlet />
        </div>
        
        {/* Empty State for Mobile */}
        <div className="flex-1 md:hidden flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600">Select a conversation</h3>
            <p className="text-gray-400 mt-1">Choose from your existing chats or start a new one</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;