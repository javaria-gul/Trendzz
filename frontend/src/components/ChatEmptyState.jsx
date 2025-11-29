import React from "react";
import { MessageCircle, Users } from "lucide-react";

const ChatEmptyState = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <MessageCircle className="w-24 h-24 text-gray-300 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-gray-600 mb-3">Your Messages</h3>
        <p className="text-gray-400 max-w-sm mx-auto mb-6">
          Send private messages to start conversations with other users on the platform.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>Connect with people you follow</span>
        </div>
      </div>
    </div>
  );
};

export default ChatEmptyState;