// src/components/Home/PostCard.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';

const PostCard = ({ 
  post, 
  onLikeToggle, 
  onAddComment, 
  currentUserId,
  formatDate: propFormatDate 
}) => {
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // ✅ FIXED: State management
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  
 // ✅ FIXED VERSION:
useEffect(() => {
  if (post) {
    // ✅ FIX: Use likes array length directly
    const likesArray = post.likes || [];
    setLikesCount(likesArray.length);  // Direct length
    
    // Check if current user liked this post
    if (currentUserId && likesArray.length > 0) {
      const userLiked = likesArray.some(like => {
        if (typeof like === 'object' && like._id) {
          return like._id.toString() === currentUserId.toString();
        }
        return like.toString() === currentUserId.toString();
      });
      setIsLiked(userLiked);
    } else {
      setIsLiked(false);
    }
    
    // Comments
    setComments(post.comments || []);
  }
}, [post, currentUserId]);

  // ✅ Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    
    if (propFormatDate) {
      return propFormatDate(dateString);
    }
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // ✅ Handle like with loading state
  const handleLikeClick = async () => {
    if (!post?._id || likeLoading) return;
    
    setLikeLoading(true);
    
    try {
      // Optimistic update
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
      
      // Call parent handler
      if (onLikeToggle) {
        await onLikeToggle(post._id);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      console.error('Like error:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  // ✅ Handle comment with loading state
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const trimmedText = commentText.trim();
    
    if (!trimmedText || !post?._id || commentLoading) return;
    
    setCommentLoading(true);
    
    try {
      // Optimistic update
      const tempComment = {
        _id: `temp_${Date.now()}`,
        user: { 
          _id: currentUserId, 
          username: 'You',
          profilePicture: ''
        },
        text: trimmedText,
        createdAt: new Date().toISOString()
      };
      
      setComments(prev => [...prev, tempComment]);
      setCommentText('');
      
      // Call parent handler
      if (onAddComment) {
        const result = await onAddComment(post._id, trimmedText);
        
        // Replace temp comment with real one if returned
        if (result?.comment) {
          setComments(prev => 
            prev.map(c => 
              c._id === tempComment._id ? result.comment : c
            )
          );
        }
      }
    } catch (error) {
      // Revert on error
      setComments(prev => prev.filter(c => !c._id?.includes('temp')));
      setCommentText(trimmedText);
      console.error('Comment error:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  // ✅ Media navigation
  const handleNextMedia = () => {
    if (currentMediaIndex < (post.media?.length || 0) - 1) {
      setCurrentMediaIndex(prev => prev + 1);
    }
  };

  const handlePrevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
    }
  };

  // ✅ Comments to display
  const displayComments = showAllComments 
    ? comments 
    : comments.slice(-2);

  const media = post.media || [];
  const commentsCount = comments.length;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <img 
            src={post.user?.profilePicture || post.user?.avatar || '/default-avatar.png'} 
            alt={post.user?.username || 'User'}
            className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover"
            onError={(e) => {
              e.target.src = '/default-avatar.png';
              e.target.onerror = null;
            }}
          />
          <div>
            <h4 className="font-semibold text-gray-800">
              @{post.user?.username || 'user'}
            </h4>
            <span className="text-xs text-gray-500">
              {formatDate(post.createdAt)}
            </span>
          </div>
        </div>
        {post.location && (
          <div className="text-sm text-gray-600">
            📍 {post.location}
          </div>
        )}
      </div>

      {/* Media */}
      {media.length > 0 && (
        <div className="relative bg-black">
          {media[currentMediaIndex]?.type === 'video' ? (
            <video 
              controls 
              className="w-full h-auto max-h-[500px] object-contain"
              poster="/video-poster.png"
            >
              <source src={media[currentMediaIndex]?.url} type="video/mp4" />
            </video>
          ) : (
            <img 
              src={media[currentMediaIndex]?.url} 
              alt={`Post by ${post.user?.username || 'user'}`}
              className="w-full h-auto max-h-[500px] object-contain"
              onError={(e) => {
                e.target.src = '/image-placeholder.png';
                e.target.onerror = null;
              }}
            />
          )}

          {media.length > 1 && (
            <>
              <button 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={handlePrevMedia}
                disabled={currentMediaIndex === 0}
              >
                ‹
              </button>
              <button 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={handleNextMedia}
                disabled={currentMediaIndex === media.length - 1}
              >
                ›
              </button>
              
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentMediaIndex + 1} / {media.length}
              </div>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {media.map((_, index) => (
                  <button 
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${index === currentMediaIndex ? 'bg-white scale-125' : 'bg-white bg-opacity-50'}`}
                    onClick={() => setCurrentMediaIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleLikeClick}
            disabled={likeLoading}
            className={`flex items-center space-x-2 transition-colors ${likeLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'} ${isLiked ? 'text-red-500' : 'text-gray-700 hover:text-red-400'}`}
          >
            {likeLoading ? (
              <span className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></span>
            ) : isLiked ? (
              '❤️'
            ) : (
              '🤍'
            )}
            <span>{isLiked ? 'Liked' : 'Like'}</span>
          </button>
          
          <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-500 transition-colors cursor-pointer">
            💬
            <span>Comment</span>
          </button>
        </div>
        
        <div className="mt-2">
          <span className="font-semibold text-gray-800">
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-gray-800">
          <span className="font-semibold">@{post.user?.username || 'user'}</span> {post.content || ''}
        </p>
        
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {post.hashtags.map((tag, index) => (
              <span 
                key={index} 
                className="text-blue-600 text-sm hover:text-blue-800 cursor-pointer"
              >
                #{tag.replace('#', '')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="p-4">
        {commentsCount > 0 && (
          <>
            <div className="space-y-3 mb-4">
                    {displayComments.map((comment, index) => (
          <div key={comment._id || index} className="flex items-start space-x-3">
            <img 
              src={comment.user?.profilePicture || comment.user?.avatar || '/default-avatar.png'} 
              alt={comment.user?.username || 'User'}
              className="w-8 h-8 rounded-full border border-gray-300 object-cover flex-shrink-0"
              onError={(e) => {
                e.target.src = '/default-avatar.png';
                e.target.onerror = null;
              }}
            />
            
            <div className="flex-1">
              <div className="flex items-baseline">
                <span className="font-semibold text-gray-800 mr-2">
                  @{comment.user?.username || 'user'}
                </span>
                <span className="text-gray-700">{comment.text}</span>
              </div>
              
              {comment.createdAt && (
                <span className="text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

            {commentsCount > 2 && (
              <button 
                className="text-blue-500 text-sm font-medium mb-4 hover:text-blue-700 transition-colors"
                onClick={() => setShowAllComments(!showAllComments)}
              >
                {showAllComments 
                  ? 'Show less comments' 
                  : `View all ${commentsCount} comments`
                }
              </button>
            )}
          </>
        )}

        <form onSubmit={handleCommentSubmit} className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={commentLoading}
          />
          <button 
            type="submit" 
            disabled={!commentText.trim() || commentLoading}
            className={`px-4 py-2 rounded-full font-semibold transition-all ${commentLoading ? 'bg-blue-300 cursor-wait' : !commentText.trim() ? 'bg-blue-200 text-blue-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            {commentLoading ? (
              <span className="flex items-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Posting...
              </span>
            ) : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostCard;