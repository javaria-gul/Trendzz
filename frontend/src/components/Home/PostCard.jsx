// src/components/Home/PostCard.jsx
import React, { useState } from 'react';

const PostCard = ({ post, onLikeToggle, onAddComment, formatDate }) => {
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const handleLikeClick = () => onLikeToggle(post._id);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(post._id, commentText.trim());
      setCommentText('');
    }
  };

  const handleNextMedia = () => {
    if (currentMediaIndex < post.media.length - 1) {
      setCurrentMediaIndex(prev => prev + 1);
    }
  };

  const handlePrevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
    }
  };

  const displayComments = showAllComments ? post.comments : post.comments.slice(-2);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <img 
            src={post.user.profilePicture} 
            alt={post.user.username}
            className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover"
            onError={(e) => e.target.src = '/default-avatar.png'}
          />
          <div>
            <h4 className="font-semibold text-gray-800">@{post.user.username}</h4>
            <span className="text-xs text-gray-500">
              {formatDate ? formatDate(post.createdAt) : 'Just now'}
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
      {post.media && post.media.length > 0 && (
        <div className="relative bg-black">
          {post.media[currentMediaIndex]?.type === 'video' ? (
            <video 
              controls 
              className="w-full h-auto max-h-[500px] object-contain"
            >
              <source src={post.media[currentMediaIndex]?.url} type="video/mp4" />
            </video>
          ) : (
            <img 
              src={post.media[currentMediaIndex]?.url} 
              alt={`Post by ${post.user.username}`}
              className="w-full h-auto max-h-[500px] object-contain"
              onError={(e) => e.target.src = '/image-placeholder.png'}
            />
          )}

          {post.media.length > 1 && (
            <>
              <button 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 disabled:opacity-30"
                onClick={handlePrevMedia}
                disabled={currentMediaIndex === 0}
              >
                ‹
              </button>
              <button 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 disabled:opacity-30"
                onClick={handleNextMedia}
                disabled={currentMediaIndex === post.media.length - 1}
              >
                ›
              </button>
              
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentMediaIndex + 1} / {post.media.length}
              </div>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {post.media.map((_, index) => (
                  <button 
                    key={index}
                    className={`w-2 h-2 rounded-full ${index === currentMediaIndex ? 'bg-white' : 'bg-white bg-opacity-50'}`}
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
            className={`flex items-center space-x-2 ${post.isLiked ? 'text-red-500' : 'text-gray-700'}`}
          >
            {post.isLiked ? '❤️' : '🤍'}
            <span>Like</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-700">
            💬
            <span>Comment</span>
          </button>
        </div>
        <div className="mt-2">
          <span className="font-semibold text-gray-800">{post.likesCount} likes</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 border-b border-gray-100">
        <p className="text-gray-800">
          <span className="font-semibold">@{post.user.username}</span> {post.content}
        </p>
        
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {post.hashtags.map((tag, index) => (
              <span key={index} className="text-blue-600 text-sm">#{tag.trim()}</span>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="p-4">
        {post.commentsCount > 0 && (
          <>
            <div className="space-y-3 mb-4">
              {displayComments.map((comment, index) => (
                <div key={comment._id || index} className="flex items-start">
                  <span className="font-semibold text-gray-800 mr-2">@{comment.user?.username || 'user'}</span>
                  <span className="text-gray-700 flex-1">{comment.text}</span>
                  {comment.createdAt && (
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDate ? formatDate(comment.createdAt) : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {post.commentsCount > 2 && (
              <button 
                className="text-blue-500 text-sm font-medium mb-4"
                onClick={() => setShowAllComments(!showAllComments)}
              >
                {showAllComments 
                  ? 'Show less comments' 
                  : `View all ${post.commentsCount} comments`
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
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            disabled={!commentText.trim()}
            className={`px-4 py-2 rounded-full font-semibold ${!commentText.trim() ? 'bg-blue-200 text-blue-400' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostCard;