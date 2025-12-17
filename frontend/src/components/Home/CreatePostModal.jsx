// src/components/Home/CreatePostModal.jsx - COMPLETE FIXED VERSION
import React, { useState, useRef, useContext, useEffect } from 'react';
import { postsAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Hash } from 'lucide-react';

const CreatePostModal = ({ onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentHashtag, setCurrentHashtag] = useState(null); // null = not typing hashtag, '' = just typed #
  const [cursorPosition, setCursorPosition] = useState(0);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (files.length + selectedFiles.length > 5) {
      alert('Maximum 5 files allowed');
      return;
    }

    const validFiles = [];
    selectedFiles.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = isImage ? 50 * 1024 * 1024 : 100 * 1024 * 1024;
      
      if (!isImage && !isVideo) {
        alert(`${file.name} is not an image or video`);
        return;
      }
      
      if (file.size > maxSize) {
        alert(`${file.name} exceeds ${isImage ? '50MB' : '100MB'} limit`);
        return;
      }
      
      validFiles.push(file);
    });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log('🚀 Starting post creation...');
    console.log('📁 Files:', files.length);
    console.log('📝 Content:', content);
    
    const token = localStorage.getItem("trendzz_token");
    if (!token) {
      setError('Please login first');
      alert('Please login first');
      navigate('/login');
      return;
    }
    
    console.log('🔑 Token exists:', !!token);
    
    // ✅ Allow either content or media (or both)
    if (files.length === 0 && !content.trim()) {
      setError('Please add some content or media');
      alert('Please add some content or media');
      return;
    }

    const formData = new FormData();
    formData.append('content', content);
    if (location) formData.append('location', location);
    if (hashtags) formData.append('hashtags', hashtags);
    
    files.forEach(file => {
      console.log('➕ Adding file:', file.name, file.type, file.size);
      formData.append('files', file);
    });

    console.log('📤 Sending request to /api/posts...');

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const response = await postsAPI.createPost(formData, (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        console.log(`📊 Upload progress: ${progress}%`);
        setUploadProgress(progress);
      });

      console.log('✅ Response from createPost:', response);
      
      if (response && response.success) {
        console.log('🎉 Post created successfully:', response.post);
        alert('Post created successfully!');
        // Pass the full post with user data for real-time feed update
        if (onPostCreated) {
          const postWithUser = {
            ...response.post,
            user: userData || response.post.user
          };
          onPostCreated(postWithUser);
        }
        if (onClose) onClose();
      } else {
        console.error('❌ Server error:', response?.message);
        setError(response?.message || 'Failed to create post');
        alert(response?.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('❌ Catch block error:', error);
      
      let errorMessage = 'Failed to create post';
      
      // Check for moderation error (403)
      if (error.response?.status === 403) {
        errorMessage = '⚠️ Your text violates community guidelines';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'object' && error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      alert(errorMessage);
      
      if (errorMessage.includes('token') || errorMessage.includes('auth') || 
          errorMessage.includes('401')) {
        localStorage.removeItem("trendzz_token");
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

  // ✨ Hashtag autocomplete - Only shows when user types #
  useEffect(() => {
    const fetchHashtagSuggestions = async () => {
      // Only show if user has typed # (currentHashtag is not null)
      if (currentHashtag === null) {
        setHashtagSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      // If user just typed # (no characters after), show trending
      if (currentHashtag.length === 0) {
        try {
          const trending = await postsAPI.getTrendingHashtags(8, 7);
          if (trending.success && trending.trending && trending.trending.length > 0) {
            setHashtagSuggestions(trending.trending);
            setShowSuggestions(true);
          } else {
            setHashtagSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error('Error fetching trending hashtags:', error);
          setHashtagSuggestions([]);
          setShowSuggestions(false);
        }
        return;
      }

      // If user is typing, search for matching hashtags
      try {
        const suggestions = await postsAPI.searchHashtags(currentHashtag, 8);
        if (suggestions && suggestions.length > 0) {
          setHashtagSuggestions(suggestions);
          setShowSuggestions(true);
        } else {
          // No matches - hide dropdown
          setHashtagSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching hashtag suggestions:', error);
        setHashtagSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchHashtagSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [currentHashtag]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    const cursorPos = e.target.selectionStart;
    setCursorPosition(cursorPos);
    
    // Check if user is typing a hashtag
    const textBeforeCursor = newContent.substring(0, cursorPos);
    const hashtagMatch = textBeforeCursor.match(/#(\w*)$/);
    
    if (hashtagMatch) {
      // User typed #, set the text after #
      setCurrentHashtag(hashtagMatch[1]);
    } else {
      // No # found, hide suggestions
      setCurrentHashtag(null);
      setShowSuggestions(false);
    }
  };

  const insertHashtag = (hashtag) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    
    // Remove the partial hashtag and insert the full one
    const beforeHashtag = textBeforeCursor.replace(/#\w*$/, '');
    const newContent = `${beforeHashtag}#${hashtag} ${textAfterCursor}`;
    
    setContent(newContent);
    setShowSuggestions(false);
    setCurrentHashtag('');
    
    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeHashtag.length + hashtag.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
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
          {/* Text Area with Blue Hashtags - Simple */}
          <div className="p-4 relative">
            {/* Styled text layer (behind) */}
            <div 
              className="absolute top-4 left-4 right-4 text-lg leading-relaxed pointer-events-none whitespace-pre-wrap break-words"
              style={{ 
                minHeight: '120px',
                color: 'transparent',
                zIndex: 1
              }}
            >
              {content.split(/(\s+)/).map((word, i) => {
                if (word.match(/^#\w+/)) {
                  return <span key={i} style={{ color: '#2563eb', fontWeight: 500 }}>{word}</span>;
                }
                return <span key={i} style={{ color: '#1f2937' }}>{word}</span>;
              })}
            </div>

            {/* Actual textarea (on top, transparent text) */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyUp={extractHashtags}
              placeholder="What's on your mind? Use #hashtags to reach more people"
              className="relative w-full border-none focus:outline-none text-lg resize-none min-h-[120px] disabled:bg-gray-100 placeholder-gray-500 bg-transparent"
              style={{
                color: 'transparent',
                caretColor: '#1f2937',
                zIndex: 2
              }}
              rows="4"
              disabled={isUploading}
            />

            {/* ✨ Hashtag Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute left-4 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-96 max-h-56 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <Hash size={16} className="text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">Trending hashtags</span>
                </div>
                <div className="overflow-y-auto max-h-48">
                  {hashtagSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => insertHashtag(suggestion.hashtag)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center justify-between transition-colors group"
                    >
                      <span className="text-blue-600 font-semibold group-hover:text-blue-700">#{suggestion.hashtag}</span>
                      <span className="text-xs text-gray-500">{suggestion.count} {suggestion.count === 1 ? 'post' : 'posts'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
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
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
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
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    isUploading || (files.length === 0 && !content.trim())
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                      : 'bg-red-700 text-white hover:bg-blue-900'
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