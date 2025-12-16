// frontend/src/pages/HashtagPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PostCard from '../components/Home/PostCard';
import { postsAPI } from '../services/api';

const HashtagPage = () => {
  const { hashtag } = useParams();
  const navigate = useNavigate();
  const { userData } = useContext(AuthContext);
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchHashtagData();
  }, [hashtag]);

  const fetchHashtagData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch posts with this hashtag
      const response = await postsAPI.getPostsByHashtag(hashtag);
      
      if (response.success) {
        setPosts(response.posts || []);
      }

      // Fetch hashtag stats
      const statsResponse = await postsAPI.getHashtagStats(hashtag);
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }

    } catch (error) {
      console.error('Error fetching hashtag data:', error);
      setError('Failed to load hashtag posts');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId, reactionType) => {
    try {
      const response = await postsAPI.likePost(postId, reactionType);
      if (response && response.success) {
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                likes: response.likesList || [],
                likesCount: response.likes || 0,
                isLiked: response.isLiked,
                userReaction: response.reactionType
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async (postId, text) => {
    try {
      const response = await postsAPI.addComment(postId, text);
      if (response && response.success) {
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: [...(post.comments || []), response.comment],
                commentsCount: (post.commentsCount || 0) + 1
              };
            }
            return post;
          })
        );
        return { success: true, comment: response.comment };
      }
    } catch (error) {
      console.error('Error adding comment:', error);
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
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await postsAPI.deletePost(postId);
      if (response && response.success) {
        setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Instagram-Style Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Top Navigation Bar */}
          <div className="py-3 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-gray-900 hover:text-blue-900 font-semibold transition-colors group"
            >
              <svg className="w-6 h-6 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-semibold text-gray-900">#{hashtag}</span>
            <div className="w-6"></div>
          </div>
        </div>
      </div>

      {/* Profile-Style Info Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Hashtag Icon */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-blue-900 via-blue-800 to-red-700 flex items-center justify-center shadow-xl ring-4 ring-white">
                <span className="text-white text-4xl sm:text-5xl font-bold">#</span>
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {hashtag}
              </h1>
              
              {/* Stats Bar */}
              {stats && (
                <div className="flex items-center justify-center sm:justify-start gap-6 mb-4">
                  <div className="text-center sm:text-left">
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.postCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {stats.postCount === 1 ? 'post' : 'posts'}
                    </div>
                  </div>
                  {stats.firstPost && (
                    <>
                      <div className="h-8 w-px bg-gray-300"></div>
                      <div className="text-center sm:text-left">
                        <div className="text-sm text-gray-600">
                          Active since
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatDate(stats.firstPost)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>POSTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

{posts.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              No posts yet
            </h2>
            <p className="text-gray-600 text-base mb-8 max-w-sm mx-auto">
              Be the first to create a post with <span className="font-semibold text-blue-900">#{hashtag}</span>
            </p>
            <button
              onClick={() => navigate('/feed')}
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-900 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Post
            </button>
          </div>
        ) : (
          <>
            {/* Instagram Explore Grid */}
            <div className="grid grid-cols-3 gap-1">
              {posts.map(post => {
                const firstMedia = post.media?.[0];
                const mediaType = firstMedia?.type || 'image';
                
                return (
                  <div
                    key={post._id}
                    className="relative aspect-square bg-gray-100 cursor-pointer group overflow-hidden"
                    onClick={() => {
                      setSelectedPost(post);
                      setIsModalOpen(true);
                    }}
                  >
                    {/* Media */}
                    {firstMedia ? (
                      mediaType === 'video' ? (
                        <video
                          src={firstMedia.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={firstMedia.url}
                          alt="Post"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span>{post.likesCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                        </svg>
                        <span>{post.commentsCount || 0}</span>
                      </div>
                    </div>

                    {/* Multiple Media Indicator */}
                    {post.media && post.media.length > 1 && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3zm0 2a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1H6zm8 2h4v4h-4V7zm0 6h4v4h-4v-4z" />
                        </svg>
                      </div>
                    )}

                    {/* Video Indicator */}
                    {mediaType === 'video' && (
                      <div className="absolute top-2 left-2">
                        <svg className="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal */}
            {isModalOpen && selectedPost && (
              <div
                className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
                onClick={() => setIsModalOpen(false)}
              >
                <div
                  className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Post Card in Modal */}
                  <div className="overflow-y-auto max-h-[90vh] scrollbar-hide">
                    <PostCard
                      post={selectedPost}
                      onLikeToggle={handleLike}
                      onAddComment={handleAddComment}
                      onDeleteComment={handleDeleteComment}
                      onDeletePost={(postId) => {
                        handleDeletePost(postId);
                        setIsModalOpen(false);
                      }}
                      currentUserId={userData?._id}
                      formatDate={formatDate}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HashtagPage;
