import Post from "../models/Post.js";
import User from "../models/User.js";
import cloudinary from '../config/cloudinary.js';
import streamifier from "streamifier";
import mongoose from 'mongoose';

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

// ✅ 1. CREATE POST - WITH SOCKET EMIT
export const createPost = async (req, res) => {
  try {
    console.log("🎯 CREATE POST - Starting...");
    const { content, hashtags, location } = req.body;
    const userId = req.user._id;

    console.log("📝 Content:", content);
    console.log("📁 Files received:", req.files?.length || 0);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one file to upload"
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

    // Upload files to Cloudinary
    console.log("📤 Starting Cloudinary uploads...");
    const media = [];
    
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

    // Parse hashtags
    const parsedHashtags = hashtags 
      ? hashtags.split(',')
          .map(tag => tag.trim().toLowerCase())
          .filter(tag => tag.startsWith('#') && tag.length > 1)
      : [];

    // Create post
    console.log("📦 Creating post in database...");
    const post = new Post({
      user: userId,
      content: content || '',
      media,
      hashtags: parsedHashtags,
      location: location || '',
      likes: [],
      comments: []
    });

    const savedPost = await post.save();
    console.log("✅ Post saved to database:", savedPost._id);

    // Populate user data
    const populatedPost = await Post.findById(savedPost._id)
      .populate('user', 'name username avatar profilePicture')
      .populate('comments.user', 'name username avatar')
      .lean();

    // ✅ EMIT SOCKET EVENT FOR AUTO-REFRESH
    if (req.emitPostCreated) {
      console.log("📢 Emitting post_created event via emitter");
      req.emitPostCreated(populatedPost);
    } else if (req.io) {
      console.log("📢 Emitting post_created event via io");
      req.io.to("feed_room").emit("post_created", {
        type: "NEW_POST",
        post: populatedPost,
        timestamp: new Date()
      });
    } else {
      console.log("⚠️ No socket.io instance found");
    }

    console.log("🎉 Post creation COMPLETE with socket emission!");

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: populatedPost,
      socketEmitted: !!req.io || !!req.emitPostCreated
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

// ✅ 2. GET FEED
export const getFeed = async (req, res) => {
  try {
    console.log("📡 GET FEED - Fetching posts...");
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

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
        path: 'likes.user',
        select: 'name username avatar profilePicture',
        model: User
      })
      .populate({
        path: 'comments.user',
        select: 'name username avatar',
        model: User
      })
      .lean();

    const totalPosts = await Post.countDocuments();
    
    console.log(`📊 Found ${posts.length} posts (Total in DB: ${totalPosts})`);
    
    res.json({
      success: true,
      posts: posts || [],
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

// ✅ 3. TOGGLE LIKE - WITH SOCKET EMIT
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    const { reactionType = 'like' } = req.body;

    console.log("❤️ TOGGLE LIKE - Post:", postId, "User:", userId, "Reaction:", reactionType);

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // ✅ CRITICAL FIX: Pehle user ka existing reaction check karein
    const existingReactionIndex = post.likes.findIndex(like => 
      like.user.toString() === userId.toString()
    );

    let action = '';
    let updatedLikesCount = post.likes.length;
    let isLiked = false;
    
    if (existingReactionIndex === -1) {
      // New like with reaction
      post.likes.push({
        user: userId,
        reaction: reactionType,
        createdAt: new Date()
      });
      action = 'liked';
      isLiked = true;
      updatedLikesCount += 1;
    } else {
      // Check if same reaction
      const existingReaction = post.likes[existingReactionIndex];
      
      if (existingReaction.reaction === reactionType) {
        // Same reaction - unlike
        post.likes.splice(existingReactionIndex, 1);
        action = 'unliked';
        isLiked = false;
        updatedLikesCount -= 1;
      } else {
        // Different reaction - update
        post.likes[existingReactionIndex].reaction = reactionType;
        post.likes[existingReactionIndex].updatedAt = new Date();
        action = 'reaction_changed';
        isLiked = true;
        // Likes count same rahega
      }
    }

    await post.save();

    // ✅ Get updated post with populated data
    const updatedPost = await Post.findById(postId)
      .populate('user', 'username profilePicture avatar name')
      .populate('likes.user', 'username profilePicture')
      .lean();

    // ✅ EMIT SOCKET EVENT FOR AUTO-REFRESH
    if (req.emitPostLiked) {
      console.log("📢 Emitting post_liked event via emitter");
      req.emitPostLiked({
        postId,
        userId: req.user._id,
        reactionType,
        likesCount: updatedPost.likes.length,
        isLiked
      });
    } else if (req.io) {
      console.log("📢 Emitting post_liked event via io");
      req.io.to(`post_${postId}`).emit("post_like_updated", {
        type: "LIKE_UPDATE",
        postId,
        userId: req.user._id,
        reactionType,
        likesCount: updatedPost.likes.length,
        isLiked,
        timestamp: new Date()
      });
      
      // Also update feed room
      req.io.to("feed_room").emit("feed_updated", {
        type: "POST_LIKED",
        postId,
        likesCount: updatedPost.likes.length,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: `Post ${action}`,
      likes: updatedPost.likes.length,
      isLiked: isLiked,
      likesList: updatedPost.likes,
      reactionType,
      socketEmitted: !!req.io || !!req.emitPostLiked
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like'
    });
  }
};

// ✅ 4. ADD COMMENT - WITH SOCKET EMIT
export const addComment = async (req, res) => {
  try {
    const { postId, text } = req.body;
    const userId = req.user._id;

    console.log("💬 ADD COMMENT - Post:", postId, "User:", userId);

    if (!postId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Post ID and comment text are required'
      });
    }

    const post = await Post.findById(postId);
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
      })
      .populate({
        path: 'likes.user',
        select: 'username profilePicture',
        model: User
      })
      .lean();

    const newComment = populatedPost.comments[populatedPost.comments.length - 1];

    // ✅ EMIT SOCKET EVENT FOR AUTO-REFRESH
    if (req.emitCommentAdded) {
      console.log("📢 Emitting comment_added event via emitter");
      req.emitCommentAdded({
        postId,
        comment: newComment,
        commentCount: populatedPost.comments.length
      });
    } else if (req.io) {
      console.log("📢 Emitting comment_added event via io");
      req.io.to(`post_${postId}`).emit("comment_added", {
        type: "NEW_COMMENT",
        postId,
        comment: newComment,
        commentCount: populatedPost.comments.length,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment,
      totalComments: populatedPost.comments.length,
      socketEmitted: !!req.io || !!req.emitCommentAdded
    });
    
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

// ✅ 5. DELETE POST - WITH SOCKET EMIT
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log("🗑️ DELETE POST - Post:", id, "User:", userId);

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

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

    await Post.findByIdAndDelete(id);

    // ✅ EMIT SOCKET EVENT FOR AUTO-REFRESH
    if (req.emitPostDeleted) {
      console.log("📢 Emitting post_deleted event via emitter");
      req.emitPostDeleted(id, req.user.username);
    } else if (req.io) {
      console.log("📢 Emitting post_deleted event via io");
      req.io.to("feed_room").emit("post_removed", {
        type: "POST_DELETED",
        postId: id,
        deletedBy: req.user.username,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Post deleted successfully',
      socketEmitted: !!req.io || !!req.emitPostDeleted
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
};

// ✅ 6. DELETE COMMENT - WITH SOCKET EMIT
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    console.log("🗑️ DELETE COMMENT - Post:", postId, "Comment:", commentId, "User:", userId);

    if (!postId || !commentId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID and Comment ID are required'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const commentIndex = post.comments.findIndex(
      comment => comment._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const comment = post.comments[commentIndex];
    const isCommentOwner = comment.user.toString() === userId.toString();
    const isPostOwner = post.user.toString() === userId.toString();

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    // ✅ EMIT SOCKET EVENT FOR AUTO-REFRESH
    if (req.io) {
      console.log("📢 Emitting comment_deleted event via io");
      req.io.to(`post_${postId}`).emit("comment_deleted", {
        postId,
        commentId,
        deletedBy: req.user.username,
        totalComments: post.comments.length,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully',
      totalComments: post.comments.length,
      socketEmitted: !!req.io
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment'
    });
  }
};

// ✅ 7. GET USER POSTS
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture')
      .lean();

    const totalPosts = await Post.countDocuments({ user: userId });

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

// ✅ 8. DEBUG: Check database directly
export const debugCheckPosts = async (req, res) => {
  try {
    console.log("🔍 DEBUG: Checking database posts...");
    
    const totalPosts = await Post.countDocuments();
    const latestPosts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name username')
      .lean();
    
    console.log(`📊 Total posts in database: ${totalPosts}`);
    
    latestPosts.forEach((post, index) => {
      console.log(`Post ${index + 1}:`);
      console.log(`  ID: ${post._id}`);
      console.log(`  Content: "${post.content?.substring(0, 50)}..."`);
      console.log(`  User: ${post.user?.username || 'Unknown'}`);
      console.log(`  Created: ${post.createdAt}`);
      console.log('---');
    });
    
    res.json({
      success: true,
      totalPosts,
      latestPosts
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

// ✅ Keep for backward compatibility
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

    const alreadyLiked = post.likes.includes(userId);
    
    if (alreadyLiked) {
      post.likes = post.likes.filter(like => like.toString() !== userId.toString());
    } else {
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