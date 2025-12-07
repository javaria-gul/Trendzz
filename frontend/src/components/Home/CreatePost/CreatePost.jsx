// frontend/src/components/CreatePost/CreatePost.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreatePost = () => {
  const navigate = useNavigate();
  
  const handleCreatePost = () => {
    // Redirect to feed or open modal
    navigate('/');
  };

  return (
    <button
      onClick={handleCreatePost}
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 w-full text-left"
    >
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
        <span className="text-blue-500 text-xl">+</span>
      </div>
      <span className="font-medium">Create Post</span>
    </button>
  );
};

export default CreatePost;