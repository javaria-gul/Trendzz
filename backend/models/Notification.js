import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // ✅ Index for faster queries
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  type: { 
    type: String, 
    required: true,
    enum: ['like', 'comment', 'follow', 'message', 'mention', 'admired'], // ✅ Validate types (added 'admired')
    index: true
  },
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post'
  },
  commentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment'
  },
  data: { 
    type: mongoose.Schema.Types.Mixed
  },
  read: { 
    type: Boolean, 
    default: false,
    index: true // ✅ Index for faster unread queries
  }
}, { timestamps: true });

// ✅ Compound index for efficient queries
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, read: 1 });

export default mongoose.model('Notification', NotificationSchema);