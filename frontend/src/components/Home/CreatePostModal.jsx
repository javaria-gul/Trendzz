import React, { useState, useRef, useContext } from 'react';
import { postsAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // ADD THIS

const CreatePostModal = ({ onClose, onPostCreated, postedOn = null }) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate(); // ADD THIS

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file count
    if (files.length + selectedFiles.length > 10) {
      alert('Maximum 10 files allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles = [];
    selectedFiles.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
      
      if (!isImage && !isVideo) {
        alert(`${file.name} is not an image or video`);
        return;
      }
      
      if (file.size > maxSize) {
        alert(`${file.name} exceeds ${isImage ? '10MB' : '50MB'} limit`);
        return;
      }
      
      validFiles.push(file);
    });

    // Create previews
    const newPreviews = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      file
    }));

    setFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    
    URL.revokeObjectURL(newPreviews[index].url);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  
const testBackend = async () => {
  try {
    console.log('🔍 Testing backend connection...');
    const response = await fetch('http://localhost:5000/api/posts/test');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    console.log('✅ Backend test response:', data);
    return data.success === true;
  } catch (error) {
    console.error('❌ Backend test failed:', error);
    return false;
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log('🚀 Starting post creation...');
    console.log('📁 Files:', files.length);
    console.log('📝 Content:', content);
    
    // Check if user is logged in
    const token = localStorage.getItem("trendzz_token");
    if (!token) {
      setError('Please login first');
      alert('Please login first');
      navigate('/login');
      return;
    }
    
    console.log('🔑 Token exists:', !!token);
    
    if (files.length === 0 && !content.trim()) {
      setError('Please add some content or media');
      alert('Please add some content or media');
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('content', content);
    if (location) formData.append('location', location);
    if (hashtags) formData.append('hashtags', hashtags);
    
    // Add files - IMPORTANT: use 'files' (plural) as field name
    files.forEach(file => {
      console.log('➕ Adding file:', file.name, file.type, file.size);
      formData.append('files', file); // 'files' not 'file'
    });

    // If this post is being created on another user's profile, include postedOn
    if (postedOn) {
      console.log('📌 Posting on profile:', postedOn);
      formData.append('postedOn', postedOn);
    }

    // Debug formData
    console.log('📦 FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, key === 'files' ? `File (${value.name})` : value);
    }

// CreatePostModal.jsx - handleSubmit function

// CHANGE THIS PART:
console.log('📤 Sending request to /api/posts...');

// ✅ FIXED: Use postsAPI.createPost with error handling and proper axios response handling
try {
  setIsUploading(true);
  const response = await postsAPI.createPost(formData, (progressEvent) => {
    const progress = Math.round(
      (progressEvent.loaded * 100) / (progressEvent.total || 1)
    );
    console.log(`📊 Upload progress: ${progress}%`);
    setUploadProgress(progress);
  });

  console.log('✅ Raw response from createPost:', response);

  const data = response?.data || response;

  if (data && (data.success === true || data.success === undefined)) {
    const createdPost = data.post || data.data || data;
    console.log('🎉 Post created successfully:', createdPost);
    alert('Post created successfully!');
    if (onPostCreated) onPostCreated(createdPost);
    if (onClose) onClose();
  } else {
    const serverMessage = data?.message || data?.error || 'Failed to create post';
    console.error('❌ Server error:', serverMessage);
    setError(serverMessage);
    alert(serverMessage);
  }
} catch (error) {
  console.error('❌ Catch block error:', error);

  let errorMessage = 'Failed to create post';
  if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error.message) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  setError(errorMessage);
  alert(errorMessage);

  if (errorMessage.toLowerCase().includes('token') || error.response?.status === 401) {
    localStorage.removeItem('trendzz_token');
    navigate('/login');
  }
} finally {
  setIsUploading(false);
}
  };

  const extractHashtags = () => {
    const tags = content.match(/#\w+/g) || [];
    setHashtags(tags.join(','));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Create Post</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={isUploading}
          >
            ×
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
           <img 
               src={userData?.profilePicture || userData?.avatar || '/default-avatar.png'} 
               alt="Profile"
               className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover"
               onError={(e) => e.target.src = '/default-avatar.png'}
              />
            <div>
              <h4 className="font-semibold text-gray-800">@{userData?.username || 'user'}</h4>
              <select 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="text-sm text-gray-600 bg-transparent border-none focus:outline-none"
                disabled={isUploading}
              >
                <option value="">Add location</option>
                <option value="Public">🌍 Public</option>
                <option value="Friends">👥 Friends</option>
                <option value="Private">🔒 Private</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Content Area */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[60vh]">
          {/* Text Area */}
          <div className="p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyUp={extractHashtags}
              placeholder="What's on your mind?"
              className="w-full border-none focus:outline-none text-lg resize-none min-h-[120px] disabled:bg-gray-100"
              rows="4"
              disabled={isUploading}
            />
            
            {/* Hashtags Preview */}
            {hashtags && (
              <div className="flex flex-wrap gap-2 mt-2">
                {hashtags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                  <span key={index} className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Media Previews */}
          {previews.length > 0 && (
            <div className="p-4 border-t">
              <div className="grid grid-cols-3 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    {preview.type === 'video' ? (
                      <video 
                        src={preview.url}
                        className="w-full h-32 object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <img 
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => e.target.src = '/image-placeholder.png'}
                      />
                    )}
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
                      >
                        ×
                      </button>
                    )}
                    <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                      {preview.type === 'video' ? '🎬' : '📷'}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {files.length} file(s) selected {!isUploading && '• Drag to reorder'}
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="p-4 border-t">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">
                {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Processing...'}
              </p>
              {uploadProgress === 100 && (
                <p className="text-center text-xs text-gray-500 mt-1">
                  Almost done! Processing your post...
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => !isUploading && fileInputRef.current.click()}
                  className={`flex items-center space-x-2 ${isUploading ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:text-blue-600'}`}
                  disabled={isUploading}
                >
                  <span className="text-2xl">📷</span>
                  <span>Photo/Video</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (files.length === 0 && !content.trim())}
                  className={`px-6 py-2 rounded-full font-semibold transition-all ${
                    isUploading || (files.length === 0 && !content.trim())
                      ? 'bg-blue-200 text-blue-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
                  }`}
                >
                  {isUploading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Posting...
                    </span>
                  ) : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;