import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { postsAPI } from '../../services/posts';

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
  const [showLikesModal, setShowLikesModal] = useState(false);
  
  // ✅ Comment reply and edit states
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingReplyData, setEditingReplyData] = useState(null); // { commentId, replyId }
  const [showReplies, setShowReplies] = useState({});
  const [showReplyOptions, setShowReplyOptions] = useState(null);
  
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

  // ✅ Get top 3 most used reactions (WhatsApp style)
  const getTopReactions = () => {
    if (!post?.likes || post.likes.length === 0) return [];
    
    const reactionCounts = {};
    post.likes.forEach(like => {
      const reaction = like.reaction || 'like';
      reactionCounts[reaction] = (reactionCounts[reaction] || 0) + 1;
    });
    
    const sorted = Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    return sorted.map(([type]) => {
      const emojiObj = emojis.find(e => e.type === type);
      return emojiObj ? emojiObj.emoji : '👍';
    });
  };

  // ✅ Get emoji by reaction type
  const getEmojiByType = (type) => {
    const emojiObj = emojis.find(e => e.type === type);
    return emojiObj ? emojiObj.emoji : '👍';
  };

  // ✅ FIXED: useEffect for reactions - Sync with post prop
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
    // ✅ Use likesCount from post if available, otherwise calculate from array
    setLikesCount(post.likesCount ?? post.likes?.length ?? 0);

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
  }, [post, currentUserId, post.likes, post.likesCount]);

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
      
      // Optimistically update UI
      const wasLiked = isLiked;
      setSelectedEmoji(newEmoji);
      if (!wasLiked) {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
      
      // Call API - backend will handle update/add logic
      if (onLikeToggle) {
        await onLikeToggle(post._id, reactionType);
      }
      
    } catch (error) {
      console.error('Emoji error:', error);
      // Revert on error - reload from post data
      if (post.likes && Array.isArray(post.likes)) {
        const userReaction = post.likes.find(like => 
          like.user?._id?.toString() === currentUserId?.toString() ||
          like.user?.toString() === currentUserId?.toString()
        );
        if (userReaction) {
          const emojiMap = {
            'like': '👍', 'love': '❤️', 'haha': '😂',
            'sad': '😢', 'angry': '😡', 'wow': '😮'
          };
          setSelectedEmoji(emojiMap[userReaction.reaction] || '👍');
          setIsLiked(true);
        } else {
          setSelectedEmoji('🤍');
          setIsLiked(false);
        }
        setLikesCount(post.likes.length);
      }
    } finally {
      setLikeLoading(false);
      setShowEmojiPicker(false);
    }
  };

  // ✅ FIXED: Handle main like button click (outline heart)
  const handleLikeClick = async () => {
    if (!post?._id || !currentUserId || likeLoading) return;
    
    setLikeLoading(true);
    
    const previousState = { isLiked, likesCount, selectedEmoji };
    
    try {
      // Optimistically update UI
      if (isLiked) {
        // Unlike - clicking same reaction removes it
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        setSelectedEmoji('🤍');
      } else {
        // Like with default thumbs up
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        setSelectedEmoji('👍');
      }
      
      // Call API
      if (onLikeToggle) {
        await onLikeToggle(post._id, 'like');
      }
    } catch (error) {
      console.error('Like error:', error);
      // Revert to previous state on error
      setIsLiked(previousState.isLiked);
      setLikesCount(previousState.likesCount);
      setSelectedEmoji(previousState.selectedEmoji);
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
      // Check if editing comment
      if (editingCommentId) {
        const response = await postsAPI.editComment(post._id, editingCommentId, trimmedText);
        const updatedComment = response.data?.comment;
        
        if (updatedComment) {
          setComments(prev => 
            prev.map(c => c._id === editingCommentId ? updatedComment : c)
          );
        } else {
          setComments(prev => 
            prev.map(c => c._id === editingCommentId ? { ...c, text: trimmedText, isEdited: true } : c)
          );
        }
        
        setEditingCommentId(null);
        setCommentText('');
      } 
      // Check if editing reply
      else if (editingReplyData) {
        const { commentId, replyId } = editingReplyData;
        await postsAPI.editReply(post._id, commentId, replyId, trimmedText);
        
        setComments(prev => 
          prev.map(c => {
            if (c._id === commentId) {
              return {
                ...c,
                replies: c.replies.map(r => 
                  r._id === replyId ? { ...r, text: trimmedText, isEdited: true } : r
                )
              };
            }
            return c;
          })
        );
        
        setEditingReplyData(null);
        setCommentText('');
      }
      // Check if replying to a comment
      else if (replyingToCommentId) {
        const response = await postsAPI.replyToComment(post._id, replyingToCommentId, trimmedText);
        const updatedComment = response.data?.comment;
        
        if (updatedComment) {
          setComments(prev => 
            prev.map(c => c._id === replyingToCommentId ? updatedComment : c)
          );
        } else {
          setComments(prev => 
            prev.map(c => {
              if (c._id === replyingToCommentId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), {
                    _id: `temp_${Date.now()}`,
                    user: { 
                      _id: currentUserId, 
                      username: userData?.username || 'You',
                      profilePicture: userData?.profilePicture || '',
                      avatar: userData?.avatar || ''
                    },
                    text: trimmedText,
                    createdAt: new Date().toISOString(),
                    isEdited: false
                  }]
                };
              }
              return c;
            })
          );
        }
        
        setReplyingToCommentId(null);
        setCommentText('');
      } 
      // Regular new comment
      else {
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
      }
    } catch (error) {
      setComments(prev => prev.filter(c => !c._id?.includes('temp')));
      setCommentText(trimmedText);
      console.error('Comment error:', error);
      
      // Check for moderation error (403)
      if (error.response?.status === 403) {
        alert('⚠️ Your text violates community guidelines');
      } else {
        alert('Failed to process comment');
      }
      
      setReplyingToCommentId(null);
      setEditingCommentId(null);
      setEditingReplyData(null);
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

  // Parse content with mentions and hashtags
  const parseContentWithMentions = (content) => {
    if (!content) return null;
    
    // Combined regex for both mentions and hashtags
    const combinedRegex = /(@\w+)|(#\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = combinedRegex.exec(content)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      if (match[1]) {
        // It's a mention (@username)
        const username = match[1].substring(1);
        parts.push(
          <span 
            key={match.index}
            className="text-blue-600 font-medium hover:text-blue-800 cursor-pointer transition-colors"
            onClick={() => navigate(`/search?q=@${username}`)}
          >
            @{username}
          </span>
        );
      } else if (match[2]) {
        // It's a hashtag (#hashtag)
        const hashtag = match[2].substring(1);
        parts.push(
          <span 
            key={match.index}
            className="text-blue-600 font-semibold hover:text-blue-800 cursor-pointer transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/hashtag/${hashtag}`);
            }}
          >
            #{hashtag}
          </span>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
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
    setShowCommentOptions(null);
    
    try {
      if (onDeleteComment) {
        await onDeleteComment(post._id, commentId);
        // Update UI only after successful deletion
        setComments(prev => prev.filter(comment => comment._id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    } finally {
      // Small delay to ensure state is clean
      setTimeout(() => {
        setDeletingCommentId(null);
      }, 300);
    }
  };

  // Edit comment
  const handleEditComment = (comment, e) => {
    e.stopPropagation();
    setEditingCommentId(comment._id);
    setCommentText(comment.text); // Use main comment box
    setShowCommentOptions(null);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingReplyData(null);
    setCommentText('');
  };

  // Reply to comment
  const handleReplyClick = (commentId, username) => {
    setReplyingToCommentId(commentId);
    setCommentText(`@${username} `);
    // Focus main comment input
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setCommentText('');
  };

  // Edit reply
  const handleEditReply = (commentId, reply, e) => {
    e.stopPropagation();
    setEditingReplyData({ commentId, replyId: reply._id });
    setCommentText(reply.text); // Use main comment box
    setShowReplyOptions(null);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleReplyOptionsClick = (replyId, e) => {
    e.stopPropagation();
    setShowReplyOptions(showReplyOptions === replyId ? null : replyId);
  };

  // Delete reply
  const handleDeleteReply = async (commentId, replyId, e) => {
    e.stopPropagation();
    
    console.log('🗑️ Attempting to delete reply:', {
      postId: post._id,
      commentId,
      replyId,
      currentUserId
    });
    
    const confirmDelete = window.confirm('Are you sure you want to delete this reply?');
    if (!confirmDelete) {
      setShowReplyOptions(null);
      return;
    }

    setShowReplyOptions(null);

    try {
      console.log('📡 Calling API deleteReply...');
      const response = await postsAPI.deleteReply(post._id, commentId, replyId);
      console.log('✅ Delete reply response:', response);
      
      // Update UI after successful deletion
      setComments(prev => 
        prev.map(c => {
          if (c._id === commentId) {
            console.log('Filtering replies for comment:', commentId);
            return {
              ...c,
              replies: c.replies ? c.replies.filter(r => r._id !== replyId) : []
            };
          }
          return c;
        })
      );
      
      console.log('✅ UI updated successfully');
    } catch (error) {
      console.error('❌ Error deleting reply:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Status code:', error.response?.status);
      
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert('Failed to delete reply: ' + errorMsg);
    }
  };

  // Toggle replies visibility
  const toggleReplies = (commentId) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
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
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                @{postUser.username || 'user'}
              </h4>
              {postUser.role && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  postUser.role === 'faculty' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {postUser.role === 'faculty' ? 'Faculty' : 'Student'}
                </span>
              )}
            </div>
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

      {/* Media or Text Content */}
      {postMedia.length > 0 ? (
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
      ) : postContent ? (
        /* Text-only post - Simple white */
        <div className="w-full bg-white p-6 min-h-[200px]">
          {/* Text Content */}
          <div className="text-gray-800 text-base leading-relaxed text-left">
            {parseContentWithMentions(postContent)}
          </div>
        </div>
      ) : null}

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
        
        {/* Show likes count with top reactions */}
        <div className="mt-2">
          {likesCount > 0 && (
            <button 
              onClick={() => setShowLikesModal(true)}
              className="flex items-center gap-2 text-sm text-gray-700 font-medium hover:text-blue-600 transition-colors cursor-pointer"
            >
              {getTopReactions().length > 0 && (
                <div className="flex -space-x-1">
                  {getTopReactions().map((emoji, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center justify-center w-5 h-5 bg-white rounded-full border border-gray-200 text-xs"
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              )}
              <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Caption Section - Only show for media posts with content or hashtags */}
      {postMedia.length > 0 && (postContent || postHashtags.length > 0) && (
        <div className="p-4 border-b border-gray-100">
          {postContent && (
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
          )}
          
          {postHashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {postHashtags.map((tag, index) => {
                const cleanHashtag = tag.replace('#', '');
                return (
                  <span 
                    key={index} 
                    className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                    onClick={() => navigate(`/hashtag/${cleanHashtag}`)}
                  >
                    #{cleanHashtag}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

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
                          {comment.isEdited && (
                            <span className="text-xs text-gray-400 ml-2">(edited)</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1">
                        {comment.createdAt && (
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        )}
                        <button
                          onClick={() => handleReplyClick(commentId, commentUser.username)}
                          className="text-xs text-blue-600 font-medium hover:text-blue-700"
                        >
                          Reply
                        </button>
                        {comment.replies && comment.replies.length > 0 && (
                          <button
                            onClick={() => toggleReplies(commentId)}
                            className="text-xs text-gray-600 font-medium hover:text-gray-700"
                          >
                            {showReplies[commentId] ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                          </button>
                        )}
                      </div>

                          {/* Replies Section */}
                      {showReplies[commentId] && comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-200">
                          {comment.replies.map((reply) => {
                            const replyUser = reply.user || {};
                            const isReplyOwner = replyUser._id === currentUserId;

                            return (
                              <div key={reply._id} className="flex gap-2 group relative">
                                <img 
                                  src={replyUser.profilePicture || replyUser.avatar || '/default-avatar.png'} 
                                  alt={replyUser.username || 'User'}
                                  className="w-6 h-6 rounded-full border border-gray-300 object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div>
                                    <span className="font-semibold text-sm text-gray-800 mr-1">
                                      @{replyUser.username || 'user'}
                                    </span>
                                    <span className="text-sm text-gray-700">
                                      {reply.text}
                                      {reply.isEdited && (
                                        <span className="text-xs text-gray-400 ml-1">(edited)</span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {reply.createdAt && (
                                      <span className="text-xs text-gray-500">
                                        {formatDate(reply.createdAt)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Reply Options Menu */}
                                {isReplyOwner && (
                                  <>
                                    <button 
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 self-start"
                                      onClick={(e) => handleReplyOptionsClick(reply._id, e)}
                                      title="Reply options"
                                    >
                                      <span className="text-sm">⋯</span>
                                    </button>

                                    {showReplyOptions === reply._id && (
                                      <div 
                                        className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-36"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          className="w-full px-4 py-2.5 text-left text-blue-600 hover:bg-blue-50 transition-colors text-xs font-medium"
                                          onClick={(e) => handleEditReply(commentId, reply, e)}
                                        >
                                          Edit Reply
                                        </button>
                                        <button
                                          className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors text-xs font-medium"
                                          onClick={(e) => handleDeleteReply(commentId, reply._id, e)}
                                        >
                                          Delete Reply
                                        </button>
                                        <button
                                          className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors text-xs font-medium"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowReplyOptions(null);
                                          }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
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
                          className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 transition-colors text-sm"
                          onClick={(e) => handleEditComment(comment, e)}
                        >
                          Edit Comment
                        </button>
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

        {/* Action indicator */}
        {(replyingToCommentId || editingCommentId || editingReplyData) && (
          <div className="mb-2 flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-sm text-blue-700">
              {editingCommentId && (
                <>✏️ Editing comment</>
              )}
              {editingReplyData && (
                <>✏️ Editing reply</>
              )}
              {replyingToCommentId && !editingCommentId && !editingReplyData && (
                <>💬 Replying to <span className="font-semibold">
                  {comments.find(c => c._id === replyingToCommentId)?.user?.username || 'user'}
                </span></>
              )}
            </span>
            <button
              onClick={() => {
                handleCancelReply();
                handleCancelEdit();
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        )}
        
        <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-2">
          <input
            ref={commentInputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              editingCommentId ? "Edit your comment..." :
              editingReplyData ? "Edit your reply..." :
              replyingToCommentId ? "Write your reply..." : 
              "Add a comment..."
            }
            className={`flex-1 border ${(replyingToCommentId || editingCommentId || editingReplyData) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'} rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-gray-800 placeholder-gray-500`}
            disabled={commentLoading}
          />
          <button 
            type="submit" 
            disabled={!commentText.trim() || commentLoading}
            className={`px-6 py-3 bg-red-700 text-white rounded-lg hover:bg-blue-900 transition font-medium whitespace-nowrap flex items-center justify-center text-sm shadow-lg ${commentLoading ? 'opacity-70 cursor-wait' : !commentText.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {commentLoading ? (
              <span className="flex items-center justify-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              </span>
            ) : editingCommentId ? 'Save' : 
              editingReplyData ? 'Save' :
              replyingToCommentId ? 'Reply' : 'Post'}
          </button>
        </form>
      </div>

      {/* ✅ Likes Modal - WhatsApp Style */}
      {showLikesModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLikesModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Reactions</h3>
              <button 
                onClick={() => setShowLikesModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Top Reactions Summary */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-4">
                {(() => {
                  const reactionCounts = {};
                  post.likes.forEach(like => {
                    const reaction = like.reaction || 'like';
                    reactionCounts[reaction] = (reactionCounts[reaction] || 0) + 1;
                  });
                  
                  return Object.entries(reactionCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const emojiObj = emojis.find(e => e.type === type);
                      return (
                        <div key={type} className="flex items-center gap-1">
                          <span className="text-xl">{emojiObj?.emoji || '👍'}</span>
                          <span className="text-sm font-medium text-gray-700">{count}</span>
                        </div>
                      );
                    });
                })()}
              </div>
            </div>

            {/* Users List */}
            <div className="overflow-y-auto max-h-[50vh]">
              {post.likes && post.likes.length > 0 ? (
                post.likes.map((like, index) => {
                  const likeUser = like.user || {};
                  const reactionEmoji = getEmojiByType(like.reaction || 'like');
                  
                  return (
                    <div 
                      key={like._id || index}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setShowLikesModal(false);
                        navigateToUserProfile(likeUser._id);
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {/* User Avatar */}
                        {likeUser.profilePicture || likeUser.avatar ? (
                          <img 
                            src={likeUser.profilePicture || likeUser.avatar} 
                            alt={likeUser.name || likeUser.username}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = '/default-avatar.png';
                              e.target.onerror = null;
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {(likeUser.name || likeUser.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">
                            {likeUser.name || likeUser.username || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            @{likeUser.username || 'user'}
                          </p>
                        </div>
                      </div>

                      {/* Reaction Emoji */}
                      <div className="text-2xl ml-2">{reactionEmoji}</div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No reactions yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;