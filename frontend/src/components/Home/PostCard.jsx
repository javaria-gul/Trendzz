import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';

const PostCard = ({ 
  post, 
  onLikeToggle, 
  onAddComment,
  onDeleteComment,
  onDeletePost,
  currentUserId,
  formatDate: propFormatDate
}) => {
  const navigate = useNavigate();
  const { userData } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [showReactionEmojis, setShowReactionEmojis] = useState(false);
  const [showCommentOptions, setShowCommentOptions] = useState(null);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [deletingPost, setDeletingPost] = useState(false);
  
  // ✅ FIXED: Default outline heart (not filled)
  const [selectedEmoji, setSelectedEmoji] = useState('🤍');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const commentInputRef = useRef(null);
  const postOptionsRef = useRef(null);
  const emojiTimeoutRef = useRef(null);

  // ✅ Emoji options for popup
  const emojis = [
    { emoji: '👍', label: 'Like', type: 'like', color: '#1877F2' },
    { emoji: '❤️', label: 'Love', type: 'love', color: '#FF0000' },
    { emoji: '😂', label: 'Haha', type: 'haha', color: '#FFD700' },
    { emoji: '😢', label: 'Sad', type: 'sad', color: '#FFA500' },
    { emoji: '😡', label: 'Angry', type: 'angry', color: '#FF4500' },
    { emoji: '😮', label: 'Wow', type: 'wow', color: '#9370DB' }
  ];

  // ✅ FIXED: useEffect for reactions - SIMPLIFIED
  useEffect(() => {
    if (!post || !currentUserId) return;

    // 1. Check if user has reacted
    let userLiked = false;
    let userReactionType = null;

    if (post.likes && Array.isArray(post.likes)) {
      const userReaction = post.likes.find(like => {
        if (!like || !like.user) return false;
        
        let likeUserId = '';
        if (typeof like.user === 'object' && like.user._id) {
          likeUserId = like.user._id;
        } else if (typeof like.user === 'string') {
          likeUserId = like.user;
        }
        
        return likeUserId && currentUserId && 
               likeUserId.toString() === currentUserId.toString();
      });

      if (userReaction) {
        userLiked = true;
        userReactionType = userReaction.reaction || 'like';
      }
    }

    setIsLiked(userLiked);
    setLikesCount(post.likes?.length || 0);

    // 2. Set emoji based on reaction
    if (userLiked) {
      const emojiMap = {
        'like': '👍',
        'love': '❤️',
        'haha': '😂',
        'sad': '😢',
        'angry': '😡',
        'wow': '😮'
      };
      setSelectedEmoji(emojiMap[userReactionType] || '👍');
    } else {
      setSelectedEmoji('🤍'); // ✅ Outline heart when not liked
    }

    // 3. Comments
    setComments(post?.comments || []);
  }, [post, currentUserId]);

  // ✅ Listen for real-time updates via socket
  useEffect(() => {
    if (!socket || !post?._id) return;

    // Listen for like updates on this post
    const handlePostLikeUpdated = (data) => {
      if (data.postId === post._id && data.userId !== currentUserId) {
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount);
        
        if (data.isLiked) {
          const emojiMap = {
            'like': '👍',
            'love': '❤️',
            'haha': '😂',
            'sad': '😢',
            'angry': '😡',
            'wow': '😮'
          };
          setSelectedEmoji(emojiMap[data.reactionType] || '👍');
        } else {
          setSelectedEmoji('🤍');
        }
      }
    };

    // Listen for new comments on this post
    const handleCommentAdded = (data) => {
      if (data.postId === post._id && data.comment.user._id !== currentUserId) {
        setComments(prev => [...prev, data.comment]);
      }
    };

    // Listen for comment deletion
    const handleCommentDeleted = (data) => {
      if (data.postId === post._id) {
        setComments(prev => prev.filter(comment => comment._id !== data.commentId));
      }
    };

    // Add event listeners
    socket.on('post_like_updated', handlePostLikeUpdated);
    socket.on('comment_added', handleCommentAdded);
    socket.on('comment_deleted', handleCommentDeleted);

    // Cleanup
    return () => {
      socket.off('post_like_updated', handlePostLikeUpdated);
      socket.off('comment_added', handleCommentAdded);
      socket.off('comment_deleted', handleCommentDeleted);
    };
  }, [socket, post?._id, currentUserId]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (emojiTimeoutRef.current) {
        clearTimeout(emojiTimeoutRef.current);
      }
    };
  }, []);

  // Close post options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (postOptionsRef.current && !postOptionsRef.current.contains(event.target)) {
        setShowPostOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date
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

  // ✅ FIXED: Handle emoji click from popup
  const handleEmojiClick = async (emojiObj) => {
    if (!post?._id || !currentUserId || likeLoading) return;
    
    setLikeLoading(true);
    
    try {
      const newEmoji = emojiObj.emoji;
      const reactionType = emojiObj.type;
      
      // ✅ UPDATE: If already liked, just change reaction
      if (isLiked) {
        // Already liked - change reaction type
        setSelectedEmoji(newEmoji);
        // Likes count same rahega
      } else {
        // Not liked - new like
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        setSelectedEmoji(newEmoji);
      }
      
      // Call API
      if (onLikeToggle) {
        await onLikeToggle(post._id, reactionType);
      }
      
    } catch (error) {
      console.error('Emoji error:', error);
      // Revert on error
      const emojiMap = {
        'like': '👍',
        'love': '❤️',
        'haha': '😂',
        'sad': '😢',
        'angry': '😡',
        'wow': '😮'
      };
      setSelectedEmoji(isLiked ? emojiMap['love'] : '🤍');
    } finally {
      setLikeLoading(false);
      setShowEmojiPicker(false);
    }
  };

  // ✅ FIXED: Handle main like button click (outline heart)
  const handleLikeClick = async () => {
    if (!post?._id || !currentUserId || likeLoading) return;
    
    setLikeLoading(true);
    
    try {
      if (isLiked) {
        // Unlike
        if (onLikeToggle) {
          await onLikeToggle(post._id, 'like');
        }
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        setSelectedEmoji('🤍'); // ✅ Reset to outline heart
      } else {
        // Like with default (like reaction)
        if (onLikeToggle) {
          await onLikeToggle(post._id, 'like');
        }
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        setSelectedEmoji('👍'); // ✅ Default thumbs up for like
      }
    } catch (error) {
      console.error('Like error:', error);
      // Revert
      setIsLiked(!isLiked);
      setSelectedEmoji(isLiked ? '🤍' : '👍');
    } finally {
      setLikeLoading(false);
      setShowEmojiPicker(false);
    }
  };

  // ✅ Emoji hover handlers
  const handleMouseEnterLike = () => {
    if (emojiTimeoutRef.current) {
      clearTimeout(emojiTimeoutRef.current);
    }
    setShowEmojiPicker(true);
  };

  const handleMouseLeaveLike = () => {
    emojiTimeoutRef.current = setTimeout(() => {
      setShowEmojiPicker(false);
    }, 300);
  };

  // Handle emoji popup hover
  const handleMouseEnterEmojiPopup = () => {
    if (emojiTimeoutRef.current) {
      clearTimeout(emojiTimeoutRef.current);
    }
    setShowEmojiPicker(true);
  };

  const handleMouseLeaveEmojiPopup = () => {
    emojiTimeoutRef.current = setTimeout(() => {
      setShowEmojiPicker(false);
    }, 300);
  };

  // ✅ FIXED: Get current display - CRITICAL FIX
  const getCurrentDisplay = () => {
    if (isLiked) {
      const emojiObj = emojis.find(e => e.emoji === selectedEmoji) || emojis[0]; // Default to thumbs up
      return {
        emoji: emojiObj.emoji,
        label: emojiObj.label,
        color: emojiObj.color
      };
    }
    // ✅ When not liked, show outline heart
    return {
      emoji: '🤍', // Outline heart for unlike state
      label: 'Like',
      color: '#65676B' // Gray color
    };
  };

  // Handle post delete
  const handlePostDelete = async () => {
    if (!post?._id || deletingPost) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) {
      setShowPostOptions(false);
      return;
    }
    
    setDeletingPost(true);
    
    try {
      if (onDeletePost) {
        await onDeletePost(post._id);
      }
      
      setShowPostOptions(false);
    } catch (error) {
      console.error('Delete post error:', error);
      alert('Failed to delete post');
    } finally {
      setDeletingPost(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const trimmedText = commentText.trim();
    
    if (!trimmedText || !post?._id || commentLoading) return;
    
    setCommentLoading(true);
    
    try {
      // Create temporary comment for immediate UI update
      const tempComment = {
        _id: `temp_${Date.now()}`,
        user: { 
          _id: currentUserId, 
          username: userData?.username || 'You',
          profilePicture: userData?.profilePicture || '',
          avatar: userData?.avatar || ''
        },
        text: trimmedText,
        createdAt: new Date().toISOString()
      };
      
      // Update UI immediately
      setComments(prev => [...prev, tempComment]);
      setCommentText('');
      
      // Call API
      if (onAddComment) {
        const result = await onAddComment(post._id, trimmedText);
        
        // Replace temp comment with real one from API response
        if (result?.comment) {
          setComments(prev => 
            prev.map(c => 
              c._id === tempComment._id ? result.comment : c
            )
          );
        }
      }
    } catch (error) {
      // Remove temp comment on error
      setComments(prev => prev.filter(c => !c._id?.includes('temp')));
      setCommentText(trimmedText);
      console.error('Comment error:', error);
      alert('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  // Focus comment input
  const focusCommentInput = () => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  // Navigate to user profile
  const navigateToUserProfile = (userId) => {
    if (userId) {
      navigate(`/user/${userId}`);
    }
  };

  // Parse content with mentions
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

  // Media navigation
  const handleNextMedia = () => {
    if (currentMediaIndex < (post?.media?.length || 0) - 1) {
      setCurrentMediaIndex(prev => prev + 1);
    }
  };

  const handlePrevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
    }
  };

  // Comment options
  const handleThreeDotsClick = (commentId, e) => {
    e.stopPropagation();
    setShowCommentOptions(showCommentOptions === commentId ? null : commentId);
  };

  const handleDeleteComment = async (commentId, e) => {
    e.stopPropagation();
    
    if (!commentId || deletingCommentId) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this comment?');
    if (!confirmDelete) {
      setShowCommentOptions(null);
      return;
    }
    
    setDeletingCommentId(commentId);
    
    try {
      if (onDeleteComment) {
        await onDeleteComment(post._id, commentId);
      }
      
      setComments(prev => prev.filter(comment => comment._id !== commentId));
      setShowCommentOptions(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Get post data
  const postUser = post?.user || {};
  const postMedia = post?.media || [];
  const postContent = post?.content || '';
  const postLocation = post?.location || '';
  const postHashtags = post?.hashtags || [];
  const postCreatedAt = post?.createdAt || '';

  // Comments
  const validComments = comments.filter(comment => comment && comment.text);
  const displayComments = showAllComments 
    ? validComments
    : validComments.slice(-2);
  const commentsCount = validComments.length;

  // Check if current user is post owner
  const isPostOwner = post.user?._id === currentUserId;

  // ✅ FIXED: Current display
  const currentDisplay = getCurrentDisplay();

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6 max-w-4xl mx-auto">
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
        
        <div className="flex items-center gap-2">
          {postLocation && (
            <div className="text-sm text-gray-600 mr-2">
              📍 {postLocation}
            </div>
          )}
          
          {isPostOwner && (
            <div className="relative" ref={postOptionsRef}>
              <button
                onClick={() => setShowPostOptions(!showPostOptions)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                title="More options"
                disabled={deletingPost}
              >
                {deletingPost ? (
                  <span className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin block"></span>
                ) : (
                  <span className="text-lg">⋯</span>
                )}
              </button>
              
              {showPostOptions && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-48">
                  <button
                    className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors text-sm flex items-center"
                    onClick={handlePostDelete}
                    disabled={deletingPost}
                  >
                    {deletingPost ? (
                      <>
                        <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin mr-2"></span>
                        Deleting...
                      </>
                    ) : (
                      'Delete Post'
                    )}
                  </button>
                  <button
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                    onClick={() => setShowPostOptions(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      {postMedia.length > 0 && (
        <div className="relative bg-black">
          {postMedia[currentMediaIndex]?.type === 'video' ? (
            <video 
              controls 
              className="w-full h-auto max-h-[600px] object-contain"
              poster="/video-poster.png"
            >
              <source src={postMedia[currentMediaIndex]?.url} type="video/mp4" />
            </video>
          ) : (
            <img 
              src={postMedia[currentMediaIndex]?.url} 
              alt={`Post by ${postUser.username || 'user'}`}
              className="w-full h-auto max-h-[600px] object-contain"
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

      {/* ✅ FIXED: Actions Section */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          {/* Like Button with Emoji Popup */}
          <div 
            className="relative"
            onMouseEnter={handleMouseEnterLike}
            onMouseLeave={handleMouseLeaveLike}
          >
            <button 
              onClick={handleLikeClick}
              disabled={likeLoading}
              className={`flex items-center space-x-2 transition-colors min-w-[80px] ${
                likeLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'
              } ${isLiked ? 'font-semibold' : 'text-gray-700 hover:text-red-500'}`}
              style={{
                color: currentDisplay.color
              }}
            >
              {likeLoading ? (
                <span className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></span>
              ) : (
                <>
                  <span className="text-xl">{currentDisplay.emoji}</span>
                  <span className="text-sm">{currentDisplay.label}</span>
                </>
              )}
            </button>

            {/* ✅ Emoji Picker Popup */}
            {showEmojiPicker && (
              <div 
                className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-xl border border-gray-200 p-2 flex space-x-1 z-50"
                onMouseEnter={handleMouseEnterEmojiPopup}
                onMouseLeave={handleMouseLeaveEmojiPopup}
                style={{
                  animation: 'fadeInUp 0.2s ease-out',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
              >
                {emojis.map((emojiObj, index) => (
                  <button
                    key={index}
                    className={`text-2xl hover:scale-125 transition-transform cursor-pointer active:scale-95 p-1 rounded-full ${
                      selectedEmoji === emojiObj.emoji && isLiked ? 'scale-125 ring-2 ring-gray-300 bg-gray-100' : ''
                    }`}
                    onClick={() => handleEmojiClick(emojiObj)}
                    title={emojiObj.label}
                    style={{
                      color: emojiObj.color
                    }}
                  >
                    {emojiObj.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Comment Button */}
          <button 
            className="flex items-center space-x-2 text-gray-700 hover:text-blue-500 transition-colors cursor-pointer"
            onClick={focusCommentInput}
          >
            <span className="text-xl">💬</span>
            <span className="text-sm">Comment</span>
          </button>
        </div>
        
        {/* Show likes count */}
        <div className="mt-2">
          {likesCount > 0 && (
            <div className="text-sm text-gray-700 font-medium">
              {likesCount} {likesCount === 1 ? 'like' : 'likes'}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 border-b border-gray-100">
        <div className="text-gray-800 text-base">
          <span 
            className="font-semibold text-gray-800 hover:text-blue-600 cursor-pointer transition-colors"
            onClick={() => navigateToUserProfile(postUser._id)}
          >
            @{postUser.username || 'user'}
          </span>
          {' '}
          <span className="leading-relaxed">
            {parseContentWithMentions(postContent)}
          </span>
        </div>
        
        {postHashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {postHashtags.map((tag, index) => (
              <span 
                key={index} 
                className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                onClick={() => navigate(`/search?q=${tag.replace('#', '')}`)}
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
              {displayComments.map((comment, index) => {
                if (!comment || !comment.text) return null;
                
                const commentUser = comment?.user || {};
                const commentText = comment.text;
                const commentId = comment?._id || `comment-${index}`;
                const isCommentOwner = commentUser._id === currentUserId;
                
                return (
                  <div 
                    key={commentId} 
                    className="flex items-start space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors group relative"
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
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline">
                        <span 
                          className="font-semibold text-gray-800 mr-2 hover:text-blue-600 cursor-pointer transition-colors truncate"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToUserProfile(commentUser._id);
                          }}
                        >
                          @{commentUser.username || 'user'}
                        </span>
                        <span className="text-gray-800 break-words">
                          {commentText}
                        </span>
                      </div>
                      
                      {comment.createdAt && (
                        <span className="text-xs text-gray-500 mt-1 block">
                          {formatDate(comment.createdAt)}
                        </span>
                      )}
                    </div>

                    {isCommentOwner && (
                      <button 
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                        onClick={(e) => handleThreeDotsClick(commentId, e)}
                        title="Comment options"
                      >
                        <span className="text-lg">⋯</span>
                      </button>
                    )}

                    {showCommentOptions === commentId && (
                      <div 
                        className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-40"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors text-sm"
                          onClick={(e) => handleDeleteComment(commentId, e)}
                          disabled={deletingCommentId === commentId}
                        >
                          {deletingCommentId === commentId ? (
                            <span className="flex items-center">
                              <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin mr-2"></span>
                              Deleting...
                            </span>
                          ) : 'Delete Comment'}
                        </button>
                        <button
                          className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCommentOptions(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
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

        <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-2">
          <input
            ref={commentInputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-gray-800 placeholder-gray-500"
            disabled={commentLoading}
          />
          <button 
            type="submit" 
            disabled={!commentText.trim() || commentLoading}
            className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium whitespace-nowrap flex items-center justify-center text-sm ${commentLoading ? 'opacity-70 cursor-wait' : !commentText.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {commentLoading ? (
              <span className="flex items-center justify-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              </span>
            ) : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostCard;