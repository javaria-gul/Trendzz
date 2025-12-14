// frontend/src/components/ChatEmptyState.jsx
import React from "react";
import { MessageCircle, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ChatEmptyState = ({ onBack, isMobile }) => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-4">
      {/* Back button for mobile */}
      {isMobile && (
        <button
          onClick={() => onBack ? onBack() : navigate('/chat')}
          className="self-start mb-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
      )}
      
      <div className="text-center">
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