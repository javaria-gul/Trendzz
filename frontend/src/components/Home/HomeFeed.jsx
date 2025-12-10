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

  // ✅ FIXED: fetchPosts function
  const fetchPosts = async (pageNum = 1) => {
    try {
      setLoading(true);
      console.log(`🔄 Fetching posts page ${pageNum}...`);
      
      // ✅ CHANGE 1:  instead of getPosts
      const response = await postsAPI.getPosts(pageNum, 100);
      
      console.log('📥 API Response:', response);
      
      // ✅ CHANGE 2: Check response.data?.posts first
      const postsData = response.data?.posts || response.posts || [];
      
      if (pageNum === 1) {
        setPosts(postsData);
      } else {
        setPosts(prev => [...prev, ...postsData]);
      }
      
      // Check if there are more posts
      setHasMore(postsData.length === 100);
      
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

  // ✅ FIXED: handleLike function
  const handleLike = async (postId) => {
    try {
      console.log('❤️ Liking post:', postId);
      
      const response = await postsAPI.likePost(postId);
      console.log('Like response:', response);
      
      if (response.success) {
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                // ✅ FIXED: Update both isLiked and likes array
                isLiked: response.isLiked,
                likes: response.likesList || post.likes,
                likesCount: response.likes || post.likesCount
              };
            }
            return post;
          })
        );
      } else {
        console.error('Like failed:', response.message);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Failed to like post');
    }
  };

  // ✅ FIXED: handleAddComment function
  const handleAddComment = async (postId, text) => {
    try {
      console.log('💬 Adding comment to post:', postId);
      
      const response = await postsAPI.addComment(postId, text);
      console.log('Comment response:', response);
      
      if (response.success) {
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                // ✅ FIXED: Add comment to array safely
                comments: [...(post.comments || []), response.comment],
                commentsCount: response.totalComments || (post.commentsCount || 0) + 1
              };
            }
            return post;
          })
        );
        
        // ✅ FIXED: Return comment for PostCard optimistic update
        return { comment: response.comment };
      } else {
        console.error('Comment failed:', response.message);
        throw new Error(response.message);
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
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Create Post Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <img 
            src={userData?.profilePicture || '/default-avatar.png'} 
            alt="Profile"
            className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover"
            onError={(e) => {
              e.target.src = '/default-avatar.png';
              e.target.onerror = null;
            }}
          />
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full px-6 py-3 text-left transition-colors"
          >
            What's on your mind?
          </button>
        </div>
        <div className="flex justify-center space-x-6 mt-4">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            <span className="text-xl">📷</span>
            <span>Photo/Video</span>
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
              // ✅ CHANGE 3: ADD currentUserId prop
              currentUserId={userData?._id}
              onLikeToggle={handleLike}
              onAddComment={handleAddComment}
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