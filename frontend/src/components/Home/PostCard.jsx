import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const PostCard = ({ 
  post, 
  onLikeToggle, 
  onAddComment, 
  onDeleteComment,
  onEditComment,
  onReplyToComment,
  onAddReaction,
  currentUserId,
  userData,
  formatDate: propFormatDate 
}) => {
  const navigate = useNavigate();
  
  // All hooks first
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [userReaction, setUserReaction] = useState(null);
  const [reactionsCount, setReactionsCount] = useState({});
  const [comments, setComments] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const commentInputRef = useRef(null);
  const reactionPickerRef = useRef(null);

  // Post properties with defaults
  const postUser = post?.user || {};
  const postMedia = post?.media || [];
  const postContent = post?.content || '';
  const postLocation = post?.location || '';
  const postHashtags = post?.hashtags || [];
  const postCreatedAt = post?.createdAt || '';
  const postReactions = post?.reactions || [];
  const postComments = post?.comments || [];
  const postPrivacy = post?.privacy || 'public';
  const isSharedPost = post?.isShared || false;
  const originalUser = post?.originalUser || null;
  const originalPost = post?.originalPost || null;

  // Available reactions
  const reactions = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'haha', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😠', label: 'Angry' }
  ];

  // Privacy icons
  const privacyIcons = {
    'public': '🌍 Public',
    'private': '🔒 Private',
    'my-eyes-only': '👁️ My Eyes Only'
  };

  // Effects
  useEffect(() => {
    if (!post || typeof post !== 'object') return;
    
    // Count reactions by type
    const counts = {};
    postReactions.forEach(reaction => {
      const type = reaction.type;
      counts[type] = (counts[type] || 0) + 1;
      
      // Check if current user has reacted
      if (currentUserId && (reaction.user?._id || reaction.user)?.toString() === currentUserId?.toString()) {
        setUserReaction(type);
      }
    });
    setReactionsCount(counts);
    
    // Set comments
    setComments(postComments);
  }, [post, currentUserId, postReactions, postComments]);

  // Close reaction picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target)) {
        setShowReactionPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Safety check
  if (!post || typeof post !== 'object') {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
        <div className="text-center text-gray-500">Post data is not available</div>
      </div>
    );
  }

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    if (propFormatDate) return propFormatDate(dateString);
    
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
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return 'Recently';
    }
  };

  // Handle reaction
  const handleReaction = async (reactionType) => {
    if (!post?._id) return;
    
    try {
      // If same reaction, remove it
      if (userReaction === reactionType) {
        setUserReaction(null);
        setReactionsCount(prev => ({
          ...prev,
          [reactionType]: Math.max(0, (prev[reactionType] || 0) - 1)
        }));
      } else {
        // Remove old reaction count
        if (userReaction) {
          setReactionsCount(prev => ({
            ...prev,
            [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1)
          }));
        }
        // Add new reaction
        setUserReaction(reactionType);
        setReactionsCount(prev => ({
          ...prev,
          [reactionType]: (prev[reactionType] || 0) + 1
        }));
      }
      
      setShowReactionPicker(false);
      
      if (onAddReaction) {
        await onAddReaction(post._id, reactionType);
      }
    } catch (error) {
      console.error('Reaction error:', error);
    }
  };

  // Handle comment submit
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const trimmedText = commentText.trim();
    
    if (!trimmedText || !post?._id) return;
    
    try {
      const tempComment = {
        _id: `temp_${Date.now()}`,
        user: { 
          _id: currentUserId, 
          username: 'You',
          profilePicture: ''
        },
        text: trimmedText,
        createdAt: new Date().toISOString(),
        replies: []
      };
      
      setComments(prev => [...prev, tempComment]);
      setCommentText('');
      
      if (onAddComment) {
        const result = await onAddComment(post._id, trimmedText);
        if (result?.comment) {
          setComments(prev => 
            prev.map(c => c._id === tempComment._id ? result.comment : c)
          );
        }
      }
    } catch (error) {
      setComments(prev => prev.filter(c => !c._id?.includes('temp')));
      setCommentText(trimmedText);
      console.error('Comment error:', error);
    }
  };

  // Handle edit comment
  const handleEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    
    try {
      if (onEditComment) {
        await onEditComment(post._id, commentId, editCommentText);
        setComments(prev => 
          prev.map(c => 
            c._id === commentId 
              ? { ...c, text: editCommentText, edited: true } 
              : c
          )
        );
      }
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (error) {
      console.error('Edit comment error:', error);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      if (onDeleteComment) {
        await onDeleteComment(post._id, commentId);
        setComments(prev => prev.filter(c => c._id !== commentId));
      }
    } catch (error) {
      console.error('Delete comment error:', error);
    }
  };

  // Handle reply submit
  const handleReplySubmit = async (commentId) => {
    if (!replyText.trim()) return;
    
    try {
      if (onReplyToComment) {
        const result = await onReplyToComment(post._id, commentId, replyText);
        if (result?.reply) {
          setComments(prev => 
            prev.map(c => 
              c._id === commentId 
                ? { ...c, replies: [...(c.replies || []), result.reply] } 
                : c
            )
          );
        }
      }
      setReplyingToCommentId(null);
      setReplyText('');
    } catch (error) {
      console.error('Reply error:', error);
    }
  };

  // Navigate to user profile
  const navigateToUserProfile = (userId) => {
    if (userId) navigate(`/user/${userId}`);
  };

  // Handle share post
  const handleSharePost = async () => {
    setShowShareModal(false);
    try {
      const { postsAPI } = await import('../../services/posts');
      const response = await postsAPI.sharePost(post._id);
      if (response.data?.success) {
        alert('Post shared to your profile! 🎉');
        window.location.reload();
      } else {
        alert(response.data?.message || 'Failed to share post');
      }
    } catch (error) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to share post');
        console.error('Share error:', error);
      }
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
    if (currentMediaIndex < postMedia.length - 1) {
      setCurrentMediaIndex(prev => prev + 1);
    }
  };

  const handlePrevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
    }
  };

  // Display comments
  const displayComments = showAllComments 
    ? comments.filter(comment => comment && comment.text)
    : comments.filter(comment => comment && comment.text).slice(-2);

  const commentsCount = comments.filter(comment => comment && comment.text).length;
  const totalReactions = Object.values(reactionsCount).reduce((sum, count) => sum + count, 0);

  // Get top reactions to display
  const topReactions = Object.entries(reactionsCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => reactions.find(r => r.type === type));

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6 w-full hover:shadow-xl transition-shadow">
      {/* Shared Post Indicator */}
      {isSharedPost && originalUser && (
        <div className="px-4 pt-3 pb-1 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="text-lg">↗️</span>
            <span className="font-semibold text-gray-900">{postUser?.name || postUser?.username}</span>
            <span>shared a post of</span>
            <span 
              className="font-semibold text-blue-600 hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigateToUserProfile(originalUser?._id || originalUser);
              }}
            >
              @{originalUser?.username || originalUser?.name || 'User'}
            </span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-start p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <img 
            src={postUser.profilePicture || postUser.avatar || '/default-avatar.png'} 
            alt={postUser.username || 'User'}
            className="w-12 h-12 rounded-full border-2 border-blue-400 object-cover cursor-pointer hover:scale-105 transition-transform shadow-md"
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
            <h4 className="font-bold text-gray-900 hover:text-blue-600 transition-colors">
              {postUser.name || postUser.username || 'User'}
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">@{postUser.username || 'user'}</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-500">{formatDate(postCreatedAt)}</span>
              {postLocation && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600">📍 {postLocation}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Privacy Badge */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
          {privacyIcons[postPrivacy] || privacyIcons.public}
        </div>
      </div>

      {/* Content */}
      {postContent && (
        <div className="px-4 pt-4">
          <div className="text-gray-800 text-base leading-relaxed">
            {parseContentWithMentions(postContent)}
          </div>
          
          {postHashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {postHashtags.map((tag, index) => (
                <span 
                  key={index} 
                  className="text-blue-600 text-sm font-semibold hover:text-blue-800 cursor-pointer hover:underline bg-blue-50 px-2 py-1 rounded"
                >
                  #{tag.replace('#', '')}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Media */}
      {postMedia.length > 0 && (
        <div className="relative bg-black mt-4">
          {postMedia[currentMediaIndex]?.type === 'video' ? (
            <video 
              controls 
              className="w-full h-auto max-h-[600px] object-contain"
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
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"
                onClick={handlePrevMedia}
                disabled={currentMediaIndex === 0}
              >
                ‹
              </button>
              <button 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"
                onClick={handleNextMedia}
                disabled={currentMediaIndex === postMedia.length - 1}
              >
                ›
              </button>
              
              <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                {currentMediaIndex + 1} / {postMedia.length}
              </div>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {postMedia.map((_, index) => (
                  <button 
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentMediaIndex ? 'bg-white scale-125 shadow-lg' : 'bg-white bg-opacity-50'}`}
                    onClick={() => setCurrentMediaIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Reactions Summary */}
      {totalReactions > 0 && (
        <div className="px-4 py-2.5 border-b border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              {topReactions.map((reaction, index) => (
                <span key={index} className="text-lg">{reaction.emoji}</span>
              ))}
              <span className="text-gray-700 font-medium ml-1">{totalReactions}</span>
            </div>
            <span className="text-gray-600">{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-around">
          {/* Reaction Button */}
          <div className="relative" ref={reactionPickerRef}>
            <button 
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              onMouseEnter={() => setShowReactionPicker(true)}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg transition-all font-medium ${userReaction ? 'text-blue-600 bg-blue-100' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              <span className="text-xl">
                {userReaction ? reactions.find(r => r.type === userReaction)?.emoji : '👍'}
              </span>
              <span>
                {userReaction ? reactions.find(r => r.type === userReaction)?.label : 'Like'}
              </span>
            </button>
            
            {/* Reaction Picker */}
            {showReactionPicker && (
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded-full shadow-2xl border-2 border-gray-200 p-3 flex space-x-2 z-10" style={{animation: 'slideUp 0.2s ease-out'}}>
                {reactions.map((reaction) => (
                  <button
                    key={reaction.type}
                    onClick={() => handleReaction(reaction.type)}
                    className="hover:scale-125 transition-transform text-2xl hover:drop-shadow-lg"
                    title={reaction.label}
                  >
                    {reaction.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button 
            className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-gray-700 hover:bg-gray-200 transition-all font-medium"
            onClick={() => commentInputRef.current?.focus()}
          >
            <span className="text-xl">💬</span>
            <span>Comment</span>
          </button>

          {/* Only show share button if not user's own post */}
          {currentUserId && postUser?._id?.toString() !== currentUserId?.toString() && (
            <button 
              className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-gray-700 hover:bg-gray-200 transition-all font-medium"
              onClick={() => setShowShareModal(true)}
            >
              <span className="text-xl">↗️</span>
              <span>Share</span>
            </button>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="px-4 py-4">
        {commentsCount > 0 && (
          <>
            <div className="space-y-4 mb-4">
              {displayComments.map((comment) => {
                if (!comment || !comment.text) return null;
                
                const commentUser = comment?.user || {};
                const commentId = comment?._id;
                const isCommentOwner = commentUser._id?.toString() === currentUserId?.toString();
                const isEditing = editingCommentId === commentId;
                const isReplying = replyingToCommentId === commentId;
                const replies = comment.replies || [];
                const showReplies = expandedReplies[commentId];
                
                return (
                  <div key={commentId} className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <img 
                        src={commentUser.profilePicture || commentUser.avatar || '/default-avatar.png'} 
                        alt={commentUser.username || 'User'}
                        className="w-9 h-9 rounded-full border-2 border-gray-300 object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => navigateToUserProfile(commentUser._id)}
                        onError={(e) => {
                          e.target.src = '/default-avatar.png';
                          e.target.onerror = null;
                        }}
                      />
                      
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
                          <span 
                            className="font-bold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors text-sm"
                            onClick={() => navigateToUserProfile(commentUser._id)}
                          >
                            {commentUser.name || commentUser.username || 'User'}
                          </span>
                          
                          {isEditing ? (
                            <div className="mt-2">
                              <input
                                type="text"
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                autoFocus
                              />
                              <div className="flex space-x-2 mt-2">
                                <button 
                                  onClick={() => handleEditComment(commentId)}
                                  className="text-xs bg-blue-500 text-white px-4 py-1.5 rounded-full hover:bg-blue-600 font-medium"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditCommentText('');
                                  }}
                                  className="text-xs bg-gray-300 text-gray-700 px-4 py-1.5 rounded-full hover:bg-gray-400 font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-800 mt-1 text-sm">{comment.text}</div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1.5 text-xs text-gray-500 ml-3 font-medium">
                          <span>{formatDate(comment.createdAt)}</span>
                          {comment.edited && <span className="italic text-gray-400">• Edited</span>}
                          <button 
                            onClick={() => setReplyingToCommentId(commentId)}
                            className="hover:text-blue-600 transition-colors"
                          >
                            Reply
                          </button>
                          {isCommentOwner && !isEditing && (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingCommentId(commentId);
                                  setEditCommentText(comment.text);
                                }}
                                className="hover:text-blue-600 transition-colors"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteComment(commentId)}
                                className="hover:text-red-600 transition-colors"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>

                        {/* Replies */}
                        {replies.length > 0 && (
                          <div className="mt-3">
                            <button
                              onClick={() => setExpandedReplies(prev => ({...prev, [commentId]: !prev[commentId]}))}
                              className="text-xs text-blue-600 font-bold hover:underline flex items-center space-x-1"
                            >
                              <span>{showReplies ? '▼' : '▶'}</span>
                              <span>{showReplies ? 'Hide' : 'View'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
                            </button>
                            
                            {showReplies && (
                              <div className="mt-3 space-y-3 ml-4 border-l-2 border-blue-200 pl-4">
                                {replies.map((reply, idx) => {
                                  const replyUser = reply?.user || {};
                                  return (
                                    <div key={idx} className="flex items-start space-x-2">
                                      <img 
                                        src={replyUser.profilePicture || replyUser.avatar || '/default-avatar.png'} 
                                        alt={replyUser.username || 'User'}
                                        className="w-7 h-7 rounded-full border border-gray-300 object-cover"
                                        onError={(e) => {
                                          e.target.src = '/default-avatar.png';
                                          e.target.onerror = null;
                                        }}
                                      />
                                      <div className="flex-1">
                                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                                          <span className="font-bold text-gray-900 text-xs">
                                            {replyUser.name || replyUser.username || 'User'}
                                          </span>
                                          <div className="text-gray-800 text-sm mt-1">{reply.text}</div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 font-medium">
                                          {formatDate(reply.createdAt)}
                                          {reply.edited && <span className="italic text-gray-400"> • Edited</span>}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reply Input */}
                        {isReplying && (
                          <div className="mt-3 ml-4">
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <button 
                                onClick={() => handleReplySubmit(commentId)}
                                disabled={!replyText.trim()}
                                className="bg-blue-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-600 disabled:bg-blue-300 transition-all"
                              >
                                Reply
                              </button>
                              <button 
                                onClick={() => {
                                  setReplyingToCommentId(null);
                                  setReplyText('');
                                }}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-400 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {commentsCount > 2 && (
              <button 
                className="text-blue-600 text-sm font-bold mb-4 hover:underline"
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
        <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center">
          <img 
            src={userData?.profilePicture || userData?.avatar || '/default-avatar.png'} 
            alt="Your avatar"
            className="w-9 h-9 rounded-full border-2 border-gray-300 object-cover"
            onError={(e) => {
              e.target.src = '/default-avatar.png';
              e.target.onerror = null;
            }}
          />
          <input
            ref={commentInputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button 
            type="submit" 
            disabled={!commentText.trim()}
            className={`px-6 py-2.5 rounded-full font-bold transition-all ${!commentText.trim() ? 'bg-blue-200 text-blue-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'}`}
          >
            Post
          </button>
        </form>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Share Post</h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Share this post by <span className="font-semibold text-gray-900">@{postUser?.username || 'user'}</span> to your profile?
                </p>
                
                {/* Preview of post */}
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <img 
                      src={postUser?.profilePicture || postUser?.avatar || '/default-avatar.png'}
                      alt="User"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="font-semibold text-sm text-gray-900">@{postUser?.username}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {postContent || 'Post content'}
                  </p>
                  {postMedia.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      📷 {postMedia.length} {postMedia.length === 1 ? 'photo' : 'photos'}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSharePost}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Share Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
