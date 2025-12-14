import React, { useState, useEffect, useContext } from 'react';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import { postsAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';

const HomeFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { userData } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  // Fetch posts
  const fetchPosts = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await postsAPI.getPosts(pageNum, 100);
      
      let postsData = [];
      if (response.data && response.data.posts) {
        postsData = response.data.posts;
      } else if (response.posts) {
        postsData = response.posts;
      } else if (Array.isArray(response)) {
        postsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        postsData = response.data;
      }
      
      if (pageNum === 1) {
        setPosts(postsData);
      } else {
        setPosts(prev => [...prev, ...postsData]);
      }
      
      setHasMore(postsData.length === 100);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  // ✅ SOCKET LISTENERS FOR AUTO-REFRESH
  useEffect(() => {
    if (!socket) return;

    // Listen for new posts
    const handleNewPost = (data) => {
      console.log('📢 New post received:', data.post._id);
      
      setPosts(prevPosts => {
        // Check if post already exists
        const exists = prevPosts.some(p => p._id === data.post._id);
        if (!exists) {
          return [data.post, ...prevPosts];
        }
        return prevPosts;
      });
    };

    // Listen for post like updates
    const handleLikeUpdate = (data) => {
      console.log('❤️ Like update received for post:', data.postId);
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === data.postId) {
            return {
              ...post,
              likesCount: data.likesCount,
              likes: data.isLiked 
                ? [...(post.likes || []), { user: data.userId, reaction: data.reactionType }]
                : (post.likes || []).filter(like => 
                    like.user?._id?.toString() !== data.userId.toString() &&
                    like.user?.toString() !== data.userId.toString()
                  )
            };
          }
          return post;
        })
      );
    };

    // Listen for new comments
    const handleNewComment = (data) => {
      console.log('💬 New comment received for post:', data.postId);
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === data.postId) {
            return {
              ...post,
              comments: [...(post.comments || []), data.comment],
              commentsCount: data.commentCount
            };
          }
          return post;
        })
      );
    };

    // Listen for post deletion
    const handlePostRemoved = (data) => {
      console.log('🗑️ Post removed:', data.postId);
      
      setPosts(prevPosts => 
        prevPosts.filter(post => post._id !== data.postId)
      );
    };

    // Add event listeners
    socket.on('post_created', handleNewPost);
    socket.on('post_like_updated', handleLikeUpdate);
    socket.on('comment_added', handleNewComment);
    socket.on('post_removed', handlePostRemoved);

    // Cleanup
    return () => {
      socket.off('post_created', handleNewPost);
      socket.off('post_like_updated', handleLikeUpdate);
      socket.off('comment_added', handleNewComment);
      socket.off('post_removed', handlePostRemoved);
    };
  }, [socket]);

  const handleLike = async (postId, reactionType = 'like') => {
    if (!postId || !userData?._id) return;
    
    try {
      const response = await postsAPI.likePost(postId, reactionType);
      
      if (response && response.success) {
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              const currentUserLiked = post.likes?.some(like => {
                if (typeof like === 'object' && like._id) {
                  return like._id.toString() === userData._id.toString();
                }
                if (typeof like === 'object' && like.user) {
                  return like.user._id?.toString() === userData._id.toString();
                }
                return like?.toString() === userData._id.toString();
              });
              
              const newLikesCount = currentUserLiked 
                ? Math.max(0, (post.likesCount || post.likes?.length || 1) - 1)
                : (post.likesCount || post.likes?.length || 0) + 1;
              
              let newLikesArray = [...(post.likes || [])];
              if (currentUserLiked) {
                newLikesArray = newLikesArray.filter(
                  like => {
                    const likeId = typeof like === 'object' ? 
                      (like._id || like.user?._id) : like;
                    return likeId?.toString() !== userData._id.toString();
                  }
                );
              } else {
                newLikesArray.push({
                  user: userData._id,
                  reaction: reactionType,
                  createdAt: new Date()
                });
              }
              
              return {
                ...post,
                likes: newLikesArray,
                likesCount: newLikesCount,
                userReaction: reactionType
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error in handleLike:', error);
    }
  };

  const handleAddComment = async (postId, text) => {
    try {
      const response = await postsAPI.addComment(postId, text);
      let responseData = response;
      if (response.data !== undefined) {
        responseData = response.data;
      }
      
      if (responseData.success) {
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: [...(post.comments || []), responseData.comment || responseData.data],
                commentsCount: responseData.totalComments || ((post.commentsCount || 0) + 1)
              };
            }
            return post;
          })
        );
        
        return { 
          comment: responseData.comment || responseData.data 
        };
      } else {
        throw new Error(responseData.message);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
      throw error;
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const response = await postsAPI.deleteComment(postId, commentId);
      
      if (response && response.success) {
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: post.comments.filter(comment => comment._id !== commentId),
                commentsCount: Math.max(0, (post.commentsCount || 1) - 1)
              };
            }
            return post;
          })
        );
        
        return { success: true };
      } else {
        throw new Error(response?.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert(error.message || 'Failed to delete comment');
      throw error;
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await postsAPI.deletePost(postId);
      
      if (response && response.success) {
        setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
        localStorage.removeItem(`post_emoji_${postId}_${userData?._id}`);
        localStorage.removeItem(`post_reactions_${postId}`);
        return { success: true };
      } else {
        throw new Error(response?.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(error.message || 'Failed to delete post');
      throw error;
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    setShowCreateModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

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

  const getProfilePicture = (user) => {
    return user?.profilePicture || user?.avatar || '/default-avatar.png';
  };

  return (
    <div className="w-full max-w-[860px] mx-auto py-5 px-4">
      {/* Create post card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full border-3 border-red-500 overflow-hidden bg-gray-100 shadow-md">
              <img 
                src={getProfilePicture(userData)} 
                alt="Profile"
                className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
                onClick={() => window.location.href = `/user/${userData?._id}`}
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                  e.target.onerror = null;
                }}
              />
            </div>
            <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>
          
          <div className="flex-1">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl px-6 py-4 text-left transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
            >
              <div className="text-lg font-normal text-gray-700">
                What's on your mind, {userData?.username || 'User'}?
              </div>
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-100 mb-6"></div>
        
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-4 text-gray-700 hover:text-blue-600 transition-colors group p-4 rounded-xl hover:bg-blue-50"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <span className="font-medium text-base">Photo/Video</span>
          </button>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-4 text-gray-700 hover:text-green-600 transition-colors group p-4 rounded-xl hover:bg-green-50"
          >
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span className="font-medium text-base">Feeling</span>
          </button>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-4 text-gray-700 hover:text-orange-600 transition-colors group p-4 rounded-xl hover:bg-orange-50"
          >
            <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <span className="font-medium text-base">Check In</span>
          </button>
        </div>
      </div>

      {/* Posts List */}
      {loading && posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-5xl mb-4 text-gray-300">📷</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No posts yet</h3>
          <p className="text-gray-600 mb-6">Be the first to share something!</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-md hover:shadow-lg"
          >
            Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="w-full">
              <PostCard
                post={post}
                currentUserId={userData?._id}
                onLikeToggle={handleLike}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onDeletePost={handleDeletePost}
                formatDate={formatDate}
              />
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && posts.length > 0 && (
        <div className="text-center mt-8">
          <button 
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              fetchPosts(nextPage);
            }}
            disabled={loading}
            className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors disabled:opacity-50 border border-gray-200 hover:border-gray-300 shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></span>
                Loading...
              </span>
            ) : 'Load More Posts'}
          </button>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default HomeFeed;