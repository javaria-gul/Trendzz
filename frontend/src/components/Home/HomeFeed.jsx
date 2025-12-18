// src/components/Home/HomeFeed.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useContext } from 'react';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import { postsAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const HomeFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { userData } = useContext(AuthContext);

  // ✅ FIXED: fetchPosts function for new API response format
  const fetchPosts = async (pageNum = 1) => {
    try {
      setLoading(true);
      console.log(`🔄 Fetching posts page ${pageNum}...`);
      const limit = 20;
      const response = await postsAPI.getAllPosts(pageNum, limit);
      console.log('📥 API Response:', response);

      const postsData = response.data?.posts || response.posts || [];

      if (pageNum === 1) {
        setPosts(postsData);
      } else {
        setPosts(prev => [...prev, ...postsData]);
      }

      const totalPages = response.data?.pagination?.pages || Math.ceil((response.data?.pagination?.total || postsData.length) / limit);
      setHasMore(pageNum < totalPages);
      
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  // ✅ FIXED: handleLike function for new API format
  const handleLike = async (postId) => {
    try {
      console.log('❤️ Liking post:', postId);
      
      const response = await postsAPI.likePost(postId);
      console.log('✅ Like response:', response);
      
      // Backend returns: { success: true, likes: number, isLiked: boolean, likesList: [...] }
      const data = response.data || response;
      
      if (data.success) {
        console.log('✅ Like saved to database. Updating UI...');
        
        // Update post with database-saved data
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                likes: data.likesList || post.likes, // Use the likesList from database
                likesCount: data.likes || post.likesCount // Use the count from database
              };
            }
            return post;
          })
        );
        
        console.log(`✅ Post ${postId} updated with ${data.likes} likes`);
      } else {
        console.error('❌ Like failed:', data.message);
      }
    } catch (error) {
      console.error('❌ Error liking post:', error);
      alert('Failed to like post');
    }
  };

  // ✅ FIXED: handleAddComment function for new API format
  const handleAddComment = async (postId, text) => {
    try {
      console.log('💬 Adding comment to post:', postId);
      
      const response = await postsAPI.addComment(postId, text);
      console.log('✅ Comment response:', response);
      
      // Backend returns: { success: true, comment: {...}, totalComments: number }
      const data = response.data || response;
      
      if (data.success) {
        console.log('✅ Comment saved to database. Updating UI...');
        
        // Update post with database-saved comment
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: [...(post.comments || []), data.comment], // Add the saved comment
                commentsCount: data.totalComments || ((post.commentsCount || 0) + 1) // Use database count
              };
            }
            return post;
          })
        );
        
        console.log(`✅ Comment added to post ${postId}. Total comments: ${data.totalComments}`);
        
        // Return comment for PostCard optimistic update
        return { 
          comment: data.comment 
        };
      } else {
        console.error('Comment failed:', data.message);
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
      throw error;
    }
  };

  const handlePostCreated = (newPost) => {
    console.log('🆕 New post created:', newPost);
    setPosts(prev => [newPost, ...prev]);
    setShowCreateModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    
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
  };

  return (
    <div className="w-full max-w-full px-4 py-8">
      {/* Create Post Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg border border-gray-200 p-6 mb-6 hover:shadow-xl transition-all">
        <div className="flex items-center space-x-4 mb-4">
          <img 
            src={userData?.profilePicture || userData?.avatar || '/default-avatar.png'} 
            alt="Profile"
            className="w-14 h-14 rounded-full border-3 border-white shadow-md object-cover ring-2 ring-blue-400"
            onError={(e) => {
              e.target.src = '/default-avatar.png';
              e.target.onerror = null;
            }}
          />
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 rounded-full px-6 py-4 text-left transition-all shadow-md hover:shadow-lg font-medium"
          >
            What's on your mind, {userData?.name || userData?.username}?
          </button>
        </div>
        <div className="flex justify-around space-x-4 pt-4 border-t border-gray-200">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-all px-4 py-2 rounded-lg hover:bg-white"
          >
            <span className="text-2xl">📷</span>
            <span className="font-medium">Photo/Video</span>
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-all px-4 py-2 rounded-lg hover:bg-white"
          >
            <span className="text-2xl">😊</span>
            <span className="font-medium">Feeling/Activity</span>
          </button>
        </div>
      </div>

      {/* Posts List */}
      {loading && posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No posts yet</h3>
          <p className="text-gray-600 mb-6">Be the first to share something!</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full transition-colors"
          >
            Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={userData?._id}
              userData={userData}
              onLikeToggle={handleLike}
              onAddComment={handleAddComment}
              onAddReaction={async (postId, reactionType) => {
                try {
                  await postsAPI.addReaction(postId, reactionType);
                } catch (error) {
                  console.error('Reaction error:', error);
                }
              }}
              onEditComment={async (postId, commentId, text) => {
                try {
                  await postsAPI.editComment(postId, commentId, text);
                } catch (error) {
                  console.error('Edit comment error:', error);
                }
              }}
              onDeleteComment={async (postId, commentId) => {
                try {
                  await postsAPI.deleteComment(postId, commentId);
                } catch (error) {
                  console.error('Delete comment error:', error);
                }
              }}
              onReplyToComment={async (postId, commentId, text) => {
                try {
                  const result = await postsAPI.replyToComment(postId, commentId, text);
                  return result.data;
                } catch (error) {
                  console.error('Reply error:', error);
                  throw error;
                }
              }}
              formatDate={formatDate}
            />
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
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-6 rounded-full transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
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