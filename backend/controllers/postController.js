// backend/controllers/postController.js - COMPLETE FIXED VERSION
import Post from "../models/Post.js";
import User from "../models/User.js";
import cloudinary from '../config/cloudinary.js'; // ✅ IMPORT CLOUDINARY
import streamifier from "streamifier";

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
        path: 'comments.user',
        select: 'name username avatar',
        model: User
      })
      .lean();

    const totalPosts = await Post.countDocuments();
    
    console.log(`📊 Found ${posts.length} posts (Total in DB: ${totalPosts})`);
    
    // Log each post for debugging
    posts.forEach((post, index) => {
      console.log(`Post ${index + 1}: ID=${post._id}, User=${post.user?.username || 'No user'}`);
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
      console.log(`  Content: "${post.content?.substring(0, 50)}..."`);
      console.log(`  User: ${post.user?.username || 'Unknown'}`);
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

// ✅ 3. TOGGLE LIKE - FIXED WITH BETTER RESPONSE
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

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

    const likeIndex = post.likes.findIndex(like => 
      like.toString() === userId.toString()
    );

    let action = '';
    
    if (likeIndex === -1) {
      // Like the post
      post.likes.push(userId);
      action = 'liked';
    } else {
      // Unlike the post
      post.likes.splice(likeIndex, 1);
      action = 'unliked';
    }

    await post.save();

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
      isLiked: likeIndex === -1,
      timestamp: new Date()
    };

    // ✅ Emit socket event if available
    if (req.io) {
      req.io.to(`post_${postId}`).emit('like_update', realtimeData);
    }

    res.json({
      success: true,
      message: `Post ${action}`,
      likes: updatedPost.likes.length,
      isLiked: likeIndex === -1,
      likesList: updatedPost.likes,
      realtimeData // ✅ For frontend real-time updates
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like'
    });
  }
};

// ✅ 4. ADD COMMENT - COMPLETE REAL-TIME VERSION
export const addCommentNew = async (req, res) => {
  try {
    const { postId, text } = req.body;
    const userId = req.user._id;

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

    // ✅ COMPLETE POPULATION FOR FRONTEND
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
        path: 'likes',
        select: 'username profilePicture',
        model: User
      })
      .lean();

    // ✅ Get the newly added comment
    const newComment = populatedPost.comments[populatedPost.comments.length - 1];

    // ✅ Prepare real-time data
    const realtimeData = {
      postId,
      comment: newComment,
      user: {
        _id: req.user._id,
        username: req.user.username,
        profilePicture: req.user.profilePicture
      },
      totalComments: populatedPost.comments.length,
      timestamp: new Date()
    };

    // ✅ Emit socket event to all users viewing this post
    if (req.io) {
      req.io.to(`post_${postId}`).emit('new_comment', realtimeData);
      console.log(`📢 Emitted new_comment event for post ${postId}`);
    }

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment,
      totalComments: populatedPost.comments.length,
      realtimeData // ✅ For frontend real-time updates
    });
    
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
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
