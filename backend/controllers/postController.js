// backend/controllers/postController.js - COMPLETE FIXED VERSION
import Post from "../models/Post.js";
import User from "../models/User.js";
import cloudinary from '../config/cloudinary.js'; // ✅ IMPORT CLOUDINARY
import streamifier from "streamifier";
import { createNotificationSafely, createBulkNotifications } from "../utils/notificationHelper.js"; // ✅ NOTIFICATION HELPERS

// ✅ Helper function with proper error handling
const uploadToCloudinaryLocal = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`📤 Uploading to Cloudinary with options:`, options);
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'social-media-posts',
        resource_type: 'auto',
        timeout: 60000,
        chunk_size: 20000000,
        ...options
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ Cloudinary upload success:', result.secure_url);
          resolve(result);
        }
      }
    );
    
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// ✅ 1. CREATE POST - FIXED
export const createPost = async (req, res) => {
  try {
    console.log("🎯 CREATE POST - Starting...");
    const { content, hashtags, location, postedOn, privacy } = req.body;
    const userId = req.user._id;

    console.log("📝 Content:", content);
    console.log("🔒 Privacy:", privacy);
    console.log("📁 Files received:", (req.files && req.files.length) || 0);

    // Allow posts without files if content exists
    if ((!req.files || req.files.length === 0) && !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please add some content or media'
      });
    }

    const maxImageSize = 20 * 1024 * 1024; // 20MB
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    let videoCount = 0;

    // Validate files
    for (const file of req.files) {
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');
      
      if (isImage && file.size > maxImageSize) {
        return res.status(400).json({
          success: false,
          message: `Image ${file.originalname} exceeds ${maxImageSize / 1024 / 1024}MB limit`
        });
      }
      
      if (isVideo) {
        videoCount++;
        if (file.size > maxVideoSize) {
          return res.status(400).json({
            success: false,
            message: `Video ${file.originalname} exceeds ${maxVideoSize / 1024 / 1024}MB limit`
          });
        }
      }

      if (!isImage && !isVideo) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} is not an image or video`
        });
      }
    }

    // Max 5 videos
    if (videoCount > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 videos allowed per post'
      });
    }

    // Upload files to Cloudinary (only if files exist)
    console.log("📤 Starting Cloudinary uploads...");
    const media = [];
    
    if (req.files && req.files.length > 0) {
    for (const [index, file] of req.files.entries()) {
      console.log(`🔄 Uploading file ${index + 1}/${req.files.length}: ${file.originalname}`);
      
      try {
        const result = await uploadToCloudinaryLocal(file.buffer, {
          folder: 'social-media-posts',
          resource_type: 'auto',
          public_id: `post_${userId}_${Date.now()}_${index}`
        });
        
        console.log(`✅ File ${index + 1} uploaded: ${result.secure_url}`);
        
        media.push({
          url: result.secure_url,
          type: result.resource_type === 'video' ? 'video' : 'image',
          public_id: result.public_id
        });
        
      } catch (uploadError) {
        console.error(`❌ Failed to upload file ${index + 1}:`, uploadError.message);
        return res.status(500).json({
          success: false,
          message: `Failed to upload ${file.originalname}: ${uploadError.message}`
        });
      }
    }
    }

    // Parse hashtags
    const parsedHashtags = hashtags 
      ? hashtags.split(',')
          .map(tag => tag.trim().toLowerCase())
          .filter(tag => tag.startsWith('#') && tag.length > 1)
      : [];

    // Create post
    console.log("📦 Creating post in database...");
    const postData = {
      user: userId,
      content: content || '',
      media,
      hashtags: parsedHashtags,
      location: location || '',
      privacy: privacy || 'public',
      likes: [],
      reactions: [],
      comments: []
    };

    // If posting on another user's profile, set postedOn
    if (postedOn) {
      postData.postedOn = postedOn;
    }

    const post = new Post(postData);

    const savedPost = await post.save();

    // Update postsCount on the appropriate user (profile owner if postedOn present, otherwise author)
    try {
      const targetUserId = postedOn || userId;
      await User.findByIdAndUpdate(targetUserId, { $inc: { postsCount: 1 } });
    } catch (incErr) {
      console.error('Failed to increment postsCount:', incErr.message);
    }
    console.log("✅ Post saved to database:", savedPost._id);

    // ✅ Detect @mentions in post content and notify mentioned users
    try {
      if (content && typeof content === 'string') {
        const mentionRegex = /@([a-zA-Z0-9_]+)/g;
        const mentionedUsernames = [];
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
          mentionedUsernames.push(match[1]);
        }

        if (mentionedUsernames.length > 0) {
          // Find user IDs for these usernames
          const mentionedUsers = await User.find({ username: { $in: mentionedUsernames } }).select('_id');
          const recipientIds = mentionedUsers.map(u => u._id).filter(id => id.toString() !== userId.toString());
          if (recipientIds.length > 0) {
            await createBulkNotifications({
              recipientIds,
              senderId: userId,
              type: 'mention',
              postId: savedPost._id,
              io: req.io
            }).catch(err => console.error('Mention notify error:', err.message));
          }
        }
      }
    } catch (mentionErr) {
      console.error('❌ Mention processing failed (non-critical):', mentionErr.message);
    }

    // Populate user data
    const populatedPost = await Post.findById(savedPost._id)
      .populate('user', 'name username avatar profilePicture')
      .populate('comments.user', 'name username avatar')
      .lean();

    console.log("🎉 Post creation COMPLETE!");

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: populatedPost
    });
    
  } catch (error) {
    console.error('❌ Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message
    });
  }
};

// ✅ 2. GET FEED - IMPROVED WITH BETTER LOGGING
export const getFeed = async (req, res) => {
  try {
    console.log("📡 GET FEED - Fetching posts...");
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get posts with population
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'user',
        select: 'name username avatar profilePicture',
        model: User
      })
      .populate({
        path: 'originalUser',
        select: 'name username avatar profilePicture',
        model: User
      })
      .populate({
        path: 'originalPost',
        select: 'content media hashtags location createdAt',
        model: Post
      })
      .populate({
        path: 'comments.user',
        select: 'name username avatar',
        model: User
      })
      .lean();

    const totalPosts = await Post.countDocuments();
    
    console.log(`📊 Found ${posts.length} posts (Total in DB: ${totalPosts})`);
    
    // Log each post for debugging
    posts.forEach((post, index) => {
      console.log(`Post ${index + 1}: ID=${post._id}, User=${(post.user && post.user.username) || 'No user'}`);
    });

    res.json({
      success: true,
      posts: posts || [], // ✅ Ensure it's always an array
      pagination: {
        page,
        limit,
        total: totalPosts,
        pages: Math.ceil(totalPosts / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
      error: error.message
    });
  }
};
// postController.js mein yeh function add karo

// ✅ DEBUG: Check database directly
export const debugCheckPosts = async (req, res) => {
  try {
    console.log("🔍 DEBUG: Checking database posts...");
    
    // Count all posts
    const totalPosts = await Post.countDocuments();
    
    // Get latest 5 posts
    const latestPosts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name username')
      .lean();
    
    console.log(`📊 Total posts in database: ${totalPosts}`);
    
    latestPosts.forEach((post, index) => {
      console.log(`Post ${index + 1}:`);
      console.log(`  ID: ${post._id}`);
      console.log(`  Content: "${(post.content && post.content.substring(0, 50)) || ''}..."`);
      console.log(`  User: ${(post.user && post.user.username) || 'Unknown'}`);
      console.log(`  Created: ${post.createdAt}`);
      console.log('---');
    });
    
    // Check if any posts are missing user reference
    const postsWithoutUser = await Post.find({ user: { $exists: false } });
    console.log(`❌ Posts without user: ${postsWithoutUser.length}`);
    
    res.json({
      success: true,
      totalPosts,
      latestPosts,
      postsWithoutUser: postsWithoutUser.length
    });
    
  } catch (error) {
    console.error("Debug check error:", error);
    res.status(500).json({
      success: false,
      message: "Debug failed",
      error: error.message
    });
  }
};

// ... rest of the functions remain the same ...

// ✅ 3. TOGGLE LIKE - FIXED WITH NOTIFICATIONS
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    console.log('❤️ LIKE REQUEST:', { postId, userId, hasIO: !!req.io });

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    const post = await Post.findById(postId).populate('user', '_id');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const likeIndex = post.likes.findIndex(like => 
      like.toString() === userId.toString()
    );

    let action = '';
    let isNewLike = false;
    
    if (likeIndex === -1) {
      // ✅ Like the postttt
      post.likes.push(userId);
      post.likesCount = post.likes.length; // Update count
      action = 'liked';
      isNewLike = true;

      // ✅ Create notification for new like
      try {
        console.log('🔔 Creating like notification...');
        await createNotificationSafely({
          recipientId: post.user._id,
          senderId: userId,
          type: 'like',
          postId,
          io: req.io
        });
        console.log('✅ Like notification created successfully');
      } catch (notifError) {
        console.error('⚠️ Like notification failed (non-critical):', notifError.message);
      }
    } else {
      // ✅ Unlike the post
      post.likes.splice(likeIndex, 1);
      post.likesCount = post.likes.length; // Update count
      action = 'unliked';
    }

    await post.save();
    console.log('✅ Post saved to database');

    // ✅ Get updated post with populated data
    const updatedPost = await Post.findById(postId)
      .populate('user', 'username profilePicture avatar name')
      .populate('likes', 'username profilePicture')
      .lean();

    // ✅ Prepare real-time data for sockets
    const realtimeData = {
      postId,
      userId: req.user._id,
      username: req.user.username,
      action,
      likesCount: updatedPost.likes.length,
      isLiked: isNewLike ? true : false,
      timestamp: new Date()
    };

    // ✅ Emit socket event if available
    if (req.io) {
      req.io.to(`post_${postId}`).emit('like_update', realtimeData);
      console.log('📡 Socket like_update emitted');
    }

    res.json({
      success: true,
      message: `Post ${action}`,
      likes: updatedPost.likes.length,
      isLiked: isNewLike,
      likesList: updatedPost.likes,
      realtimeData
    });
  } catch (error) {
    console.error('❌ Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ 4. ADD COMMENT - WITH NOTIFICATIONS & BETTER ERROR HANDLING
export const addCommentNew = async (req, res) => {
  try {
    const { postId, text } = req.body;
    const userId = req.user._id;

    console.log('💬 COMMENT REQUEST:', { postId, userId, hasIO: !!req.io });

    if (!postId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Post ID and comment text are required'
      });
    }

    // ✅ Validate comment length
    if (text.trim().length < 1 || text.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be between 1 and 1000 characters'
      });
    }

    const post = await Post.findById(postId).populate('user', '_id');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = {
      user: userId,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    post.commentsCount = post.comments.length; // Update count
    await post.save();
    console.log('✅ Comment saved to database');

    // ✅ Get populated comment
    const populatedPost = await Post.findById(postId)
      .populate({
        path: 'comments.user',
        select: 'username profilePicture avatar name',
        model: User
      })
      .populate({
        path: 'user',
        select: 'username profilePicture avatar name',
        model: User
      });
    
    const newComment = populatedPost.comments[populatedPost.comments.length - 1];

    try {
      console.log('🔔 Creating comment notification...');
      await createNotificationSafely({
        recipientId: post.user._id,
        senderId: userId,
        type: 'comment',
        postId,
        io: req.io,
        data: { commentText: text.substring(0, 100) }
      });
      console.log('✅ Comment notification created successfully');
    } catch (notifError) {
      console.error('⚠️ Comment notification failed (non-critical):', notifError.message);
    }

    // ✅ Detect @mentions in comment text and notify mentioned users
    try {
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      const mentionedUsernames = [];
      let m;
      while ((m = mentionRegex.exec(text)) !== null) {
        mentionedUsernames.push(m[1]);
      }

      if (mentionedUsernames.length > 0) {
        console.log(`🔔 Detected ${mentionedUsernames.length} mentions: ${mentionedUsernames.join(', ')}`);
        const mentionedUsers = await User.find({ username: { $in: mentionedUsernames } }).select('_id');
        const recipientIds = mentionedUsers.map(u => u._id).filter(id => id.toString() !== userId.toString());
        if (recipientIds.length > 0) {
          console.log(`📢 Creating mention notifications for ${recipientIds.length} users`);
          await createBulkNotifications({
            recipientIds,
            senderId: userId,
            type: 'mention',
            postId,
            commentId: newComment._id,
            io: req.io
          }).catch(err => console.error('Mention notify (comment) error:', err.message));
        }
      }
    } catch (mentionErr) {
      console.error('❌ Mention processing (comment) failed (non-critical):', mentionErr.message);
    }

    // ✅ Emit real-time update
    if (req.io) {
      req.io.to(`post_${postId}`).emit('comment_added', {
        postId,
        comment: newComment,
        totalComments: populatedPost.comments.length
      });
      console.log('📡 Socket comment_added emitted');
    }

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment,
      totalComments: populatedPost.comments.length
    });
  } catch (error) {
    console.error('❌ Comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// ✅ 5. DELETE POST (Master Prompt)
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the post owner
    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Delete media from Cloudinary
    for (const mediaItem of post.media) {
      try {
        await cloudinary.uploader.destroy(mediaItem.public_id, {
          resource_type: mediaItem.type === 'video' ? 'video' : 'image'
        });
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
      }
    }

    // Delete post from database
    await Post.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
};

// ✅ 6. GET USER POSTS (Master Prompt)
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

      console.log(`getUserPosts called for userId=${userId}, page=${page}, limit=${limit}`);
      const query = { $or: [{ user: userId }, { postedOn: userId }] };
      const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username profilePicture avatar')
        .populate('originalUser', 'username profilePicture avatar name')
        .populate('originalPost', 'content media hashtags location createdAt')
        .populate('comments.user', 'username profilePicture')
        .lean();

      const totalPosts = await Post.countDocuments(query);
      console.log(`getUserPosts returning ${posts.length} posts (total ${totalPosts}) for userId=${userId}`);

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        pages: Math.ceil(totalPosts / limit)
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user posts'
    });
  }
};

// ✅ Keep your existing functions for backward compatibility
export const addLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already liked
    const alreadyLiked = post.likes.includes(userId);
    
    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter(like => like.toString() !== userId.toString());
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      message: alreadyLiked ? 'Post unliked' : 'Post liked',
      likes: post.likes.length
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like post'
    });
  }
};

// ✅ Keep your existing addComment
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = {
      user: userId,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Populate the added comment
    const populatedPost = await Post.findById(id)
      .populate('comments.user', 'username profilePicture');
    
    const newComment = populatedPost.comments.pop();

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
  
}
// ✅ NEW: ADD REACTION
export const addReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user._id;

    console.log('😊 REACTION REQUEST:', { postId, userId, reactionType });

    const validReactions = ['like', 'love', 'haha', 'sad', 'angry', 'wow'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Find existing reaction from this user
    const existingReactionIndex = post.reactions.findIndex(
      r => r.user.toString() === userId.toString()
    );

    if (existingReactionIndex !== -1) {
      // If same reaction, remove it
      if (post.reactions[existingReactionIndex].type === reactionType) {
        post.reactions.splice(existingReactionIndex, 1);
      } else {
        // Update to new reaction
        post.reactions[existingReactionIndex].type = reactionType;
        post.reactions[existingReactionIndex].createdAt = new Date();
      }
    } else {
      // Add new reaction
      post.reactions.push({
        user: userId,
        type: reactionType,
        createdAt: new Date()
      });
    }

    await post.save();

    // Get reactions count by type
    const reactionsCount = {};
    post.reactions.forEach(r => {
      reactionsCount[r.type] = (reactionsCount[r.type] || 0) + 1;
    });

    res.json({
      success: true,
      message: 'Reaction updated',
      reactions: post.reactions,
      reactionsCount,
      userReaction: existingReactionIndex !== -1 ? post.reactions[existingReactionIndex]?.type : null
    });
  } catch (error) {
    console.error('❌ Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction',
      error: error.message
    });
  }
};

// ✅ NEW: EDIT COMMENT
export const editComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    console.log('✏️ EDIT COMMENT REQUEST:', { postId, commentId, userId });

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    comment.text = text.trim();
    comment.edited = true;
    comment.editedAt = new Date();

    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('comments.user', 'username profilePicture avatar name');

    const updatedComment = updatedPost.comments.id(commentId);

    res.json({
      success: true,
      message: 'Comment updated',
      comment: updatedComment
    });
  } catch (error) {
    console.error('❌ Edit comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to edit comment',
      error: error.message
    });
  }
};

// ✅ NEW: DELETE COMMENT
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    console.log('🗑️ DELETE COMMENT REQUEST:', { postId, commentId, userId });

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment or the post
    if (comment.user.toString() !== userId.toString() && post.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments or comments on your posts'
      });
    }

    comment.remove();
    post.commentsCount = post.comments.length;
    await post.save();

    res.json({
      success: true,
      message: 'Comment deleted'
    });
  } catch (error) {
    console.error('❌ Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

// ✅ NEW: REPLY TO COMMENT
export const replyToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    console.log('↩️ REPLY TO COMMENT REQUEST:', { postId, commentId, userId });

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const reply = {
      user: userId,
      text: text.trim(),
      createdAt: new Date()
    };

    if (!comment.replies) {
      comment.replies = [];
    }
    comment.replies.push(reply);

    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('comments.user', 'username profilePicture avatar name')
      .populate('comments.replies.user', 'username profilePicture avatar name');

    const updatedComment = updatedPost.comments.id(commentId);
    const newReply = updatedComment.replies[updatedComment.replies.length - 1];

    res.json({
      success: true,
      message: 'Reply added',
      reply: newReply
    });
  } catch (error) {
    console.error('❌ Reply to comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reply',
      error: error.message
    });
  }
};

// ✅ NEW: SHARE POST
export const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    console.log('📤 SHARE POST REQUEST:', { postId, userId });

    // Find original post
    const originalPost = await Post.findById(postId)
      .populate('user', 'name username avatar profilePicture');

    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already shared this post
    const alreadyShared = await Post.findOne({
      user: userId,
      originalPost: postId,
      isShared: true
    });

    if (alreadyShared) {
      return res.status(400).json({
        success: false,
        message: 'You have already shared this post'
      });
    }

    // Create shared post
    const sharedPost = new Post({
      user: userId,
      isShared: true,
      originalPost: postId,
      originalUser: originalPost.user._id,
      content: originalPost.content,
      media: originalPost.media,
      hashtags: originalPost.hashtags,
      location: originalPost.location,
      privacy: 'public',
      likes: [],
      reactions: [],
      comments: []
    });

    await sharedPost.save();

    // Update user's posts count
    await User.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } });

    // Populate the shared post
    const populatedSharedPost = await Post.findById(sharedPost._id)
      .populate('user', 'name username avatar profilePicture')
      .populate('originalUser', 'name username avatar profilePicture')
      .populate({
        path: 'originalPost',
        populate: {
          path: 'user',
          select: 'name username avatar profilePicture'
        }
      })
      .lean();

    res.json({
      success: true,
      message: 'Post shared successfully',
      post: populatedSharedPost
    });
  } catch (error) {
    console.error('❌ Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share post',
      error: error.message
    });
  }
};

// ✅ NEW: SOCKET ROOM JOIN FUNCTION (ADD AT THE END OF FILE)
export const joinPostRoom = (socket, postId) => {
  socket.join(`post_${postId}`);
  console.log(`👥 User joined post room: post_${postId}`);
};

// ✅ NEW: SOCKET ROOM LEAVE FUNCTION
export const leavePostRoom = (socket, postId) => {
  socket.leave(`post_${postId}`);
  console.log(`👋 User left post room: post_${postId}`);
};