// src/components/Home/HomeFeed.jsx
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

// HomeFeed.jsx - fetchPosts function mein
const fetchPosts = async (pageNum = 1) => {
  try {
    setLoading(true);
    console.log(`🔄 Fetching posts page ${pageNum}...`);
    
    const response = await postsAPI.getPosts(pageNum, 10);
    
    console.log('📥 API Response:', response);
    console.log('Posts data:', response.posts);
    
    // ✅ FIXED: Check response structure properly
    const postsData = response.posts || response.data?.posts || [];
    
    if (pageNum === 1) {
      setPosts(postsData);
    } else {
      setPosts(prev => [...prev, ...postsData]);
    }
    
    // Check if there are more posts
    setHasMore(postsData.length === 10);
    
  } catch (error) {
    console.error('❌ Error fetching posts:', error);
    console.error('Error response:', error.response?.data);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchPosts(1);
  }, []);

  const handleLike = async (postId) => {
    try {
      const response = await postsAPI.likePost(postId);
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                isLiked: response.isLiked,
                likesCount: response.likes 
              } 
            : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async (postId, text) => {
    try {
      const response = await postsAPI.addComment(postId, text);
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                comments: [...post.comments, response.comment],
                commentsCount: (post.commentsCount || 0) + 1
              } 
            : post
        )
      );
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    setShowCreateModal(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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