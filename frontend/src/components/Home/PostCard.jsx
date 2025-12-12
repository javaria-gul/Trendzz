import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const PostCard = ({ 
  post, 
  onLikeToggle, 
  onAddComment, 
  currentUserId,
  formatDate: propFormatDate 
}) => {
  const navigate = useNavigate();
  
  // ✅ ALL HOOKS MUST COME FIRST
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const commentInputRef = useRef(null);

  // ✅ NOW SAFELY ACCESS POST PROPERTIES WITH DEFAULT VALUES
  const postUser = post?.user || {};
  const postMedia = post?.media || [];
  const postContent = post?.content || '';
  const postLocation = post?.location || '';
  const postHashtags = post?.hashtags || [];
  const postCreatedAt = post?.createdAt || '';
  const postLikes = post?.likes || [];
  const postComments = post?.comments || [];

  // ✅ USE EFFECTS MUST ALSO COME BEFORE CONDITIONAL RETURNS
  useEffect(() => {
    if (!post || typeof post !== 'object') return;
    
    // Set likes count
    setLikesCount(postLikes.length);
    
    // Check if current user liked this post
    if (currentUserId && postLikes.length > 0) {
      const userLiked = postLikes.some(like => {
        if (typeof like === 'object' && like._id) {
          return like._id.toString() === currentUserId.toString();
        }
        return like?.toString() === currentUserId.toString();
      });
      setIsLiked(userLiked);
    } else {
      setIsLiked(false);
    }
    
    // Set comments
    setComments(postComments);
  }, [post, currentUserId, postLikes, postComments]);

  // ✅ NOW DO THE SAFETY CHECK FOR RENDERING
  if (!post || typeof post !== 'object') {
    console.error('PostCard: Invalid post data received', post);
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
        <div className="text-center text-gray-500">
          Post data is not available
        </div>
      </div>
    );
  }

  // ✅ Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    
    if (propFormatDate) {
      return propFormatDate(dateString);
    }
    
    try {
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
    } catch (error) {
      return 'Recently';
    }
  };

  // ✅ Handle like
  const handleLikeClick = async () => {
    if (!post?._id || likeLoading) return;
    
    setLikeLoading(true);
    
    try {
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
      
      if (onLikeToggle) {
        await onLikeToggle(post._id);
      }
    } catch (error) {
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      console.error('Like error:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  // ✅ Handle comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const trimmedText = commentText.trim();
    
    if (!trimmedText || !post?._id || commentLoading) return;
    
    setCommentLoading(true);
    
    try {
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
      
      if (onAddComment) {
        const result = await onAddComment(post._id, trimmedText);
        
        if (result?.comment) {
          setComments(prev => 
            prev.map(c => 
              c._id === tempComment._id ? result.comment : c
            )
          );
        }
      }
    } catch (error) {
      setComments(prev => prev.filter(c => !c._id?.includes('temp')));
      setCommentText(trimmedText);
      console.error('Comment error:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  // ✅ Focus comment input
  const focusCommentInput = () => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
      commentInputRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };

  // ✅ Navigate to user profile
  const navigateToUserProfile = (userId) => {
    if (userId) {
      navigate(`/user/${userId}`);
    }
  };

  // ✅ Parse content with mentions
  const parseContentWithMentions = (content) => {
    if (!content) return null;
    
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      const username = match[1];
      parts.push(
        <span 
          key={match.index}
          className="text-blue-600 font-medium hover:text-blue-800 cursor-pointer transition-colors"
          onClick={() => navigate(`/search?q=@${username}`)}
        >
          @{username}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : content;
  };

  // ✅ Media navigation
  const handleNextMedia = () => {
    if (currentMediaIndex < postMedia.length - 1) {
      setCurrentMediaIndex(prev => prev + 1);
    }
  };

  const handlePrevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
    }
  };

  // ✅ Display comments with SAFE CHECK
  const displayComments = showAllComments 
    ? comments.filter(comment => comment && comment.text) // Filter out invalid comments
    : comments.filter(comment => comment && comment.text).slice(-2);

  const commentsCount = comments.filter(comment => comment && comment.text).length;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <img 
            src={postUser.profilePicture || postUser.avatar || '/default-avatar.png'} 
            alt={postUser.username || 'User'}
            className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => navigateToUserProfile(postUser._id)}
            onError={(e) => {
              e.target.src = '/default-avatar.png';
              e.target.onerror = null;
            }}
          />
          <div 
            className="cursor-pointer" 
            onClick={() => navigateToUserProfile(postUser._id)}
          >
            <h4 className="font-semibold text-gray-800 hover:text-blue-600 transition-colors">
              @{postUser.username || 'user'}
            </h4>
            <span className="text-xs text-gray-500">
              {formatDate(postCreatedAt)}
            </span>
          </div>
        </div>
        {postLocation && (
          <div className="text-sm text-gray-600">
            📍 {postLocation}
          </div>
        )}
      </div>

      {/* Media */}
      {postMedia.length > 0 && (
        <div className="relative bg-black">
          {postMedia[currentMediaIndex]?.type === 'video' ? (
            <video 
              controls 
              className="w-full h-auto max-h-[500px] object-contain"
              poster="/video-poster.png"
            >
              <source src={postMedia[currentMediaIndex]?.url} type="video/mp4" />
            </video>
          ) : (
            <img 
              src={postMedia[currentMediaIndex]?.url} 
              alt={`Post by ${postUser.username || 'user'}`}
              className="w-full h-auto max-h-[500px] object-contain"
              onError={(e) => {
                e.target.src = '/image-placeholder.png';
                e.target.onerror = null;
              }}
            />
          )}

          {postMedia.length > 1 && (
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
                disabled={currentMediaIndex === postMedia.length - 1}
              >
                ›
              </button>
              
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentMediaIndex + 1} / {postMedia.length}
              </div>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {postMedia.map((_, index) => (
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
          
          <button 
            className="flex items-center space-x-2 text-gray-700 hover:text-blue-500 transition-colors cursor-pointer"
            onClick={focusCommentInput}
          >
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
        <div className="text-gray-800">
          <span 
            className="font-semibold text-gray-800 hover:text-blue-600 cursor-pointer transition-colors"
            onClick={() => navigateToUserProfile(postUser._id)}
          >
            @{postUser.username || 'user'}
          </span>
          {' '}
          <span>
            {parseContentWithMentions(postContent)}
          </span>
        </div>
        
        {postHashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {postHashtags.map((tag, index) => (
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

      {/* Comments - WITH SAFE MAPPING */}
      <div className="p-4">
        {commentsCount > 0 && (
          <>
            <div className="space-y-3 mb-4">
              {displayComments.map((comment, index) => {
                // ✅ SAFETY CHECK FOR EACH COMMENT
                if (!comment || !comment.text) return null;
                
                const commentUser = comment?.user || {};
                const commentText = comment.text;
                const commentId = comment?._id || `comment-${index}`;
                
                return (
                  <div 
                    key={commentId} 
                    className="flex items-start space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    onClick={focusCommentInput}
                  >
                    <img 
                      src={commentUser.profilePicture || commentUser.avatar || '/default-avatar.png'} 
                      alt={commentUser.username || 'User'}
                      className="w-8 h-8 rounded-full border border-gray-300 object-cover flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToUserProfile(commentUser._id);
                      }}
                      onError={(e) => {
                        e.target.src = '/default-avatar.png';
                        e.target.onerror = null;
                      }}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-baseline">
                        <span 
                          className="font-semibold text-gray-800 mr-2 hover:text-blue-600 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToUserProfile(commentUser._id);
                          }}
                        >
                          @{commentUser.username || 'user'}
                        </span>
                        <span className="text-gray-700">{commentText}</span>
                      </div>
                      
                      {comment.createdAt && (
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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

        {/* Comment Input */}
        <form onSubmit={handleCommentSubmit} className="flex gap-2">
          <input
            ref={commentInputRef}
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