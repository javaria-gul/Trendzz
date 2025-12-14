// backend/models/Post.js - COMPLETE FIXED VERSION
import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reaction: {
    type: String,
    enum: ['like', 'love', 'haha', 'sad', 'angry', 'wow'],
    default: 'like'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true,
    maxlength: 2200,
    default: ''
  },
  media: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    public_id: {
      type: String,
      required: true
    }
  }],
  hashtags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  location: {
    type: String,
    trim: true,
    default: ''
  },
  likes: [reactionSchema], // ✅ FIXED: Array of reaction objects
  comments: [commentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;