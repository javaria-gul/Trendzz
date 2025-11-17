import React from "react";
import { MessageCircle, Users, Search } from "lucide-react";

const ChatEmptyState = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-8">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Your Messages</h2>
        <p className="text-gray-500 mb-8">
          Send private messages to start conversations with your friends and connections.
        </p>
        
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <span>Connect with friends and followers</span>
          </div>
          
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Search className="w-4 h-4 text-green-600" />
            </div>
            <span>Search users to start new conversations</span>
          </div>
        </div>
        
        <button className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
          Start New Conversation
        </button>
      </div>
    </div>
  );
};

export default ChatEmptyState;