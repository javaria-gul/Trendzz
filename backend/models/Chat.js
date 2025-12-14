import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  // ✅ TEMPORARILY required: false rakho (existing data ke liye)
  chat: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Chat", 
    required: false,  // ✅ CHANGE FROM true TO false
    index: true
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  text: { 
    type: String, 
    default: "",
    trim: true
  },
  image: { 
    type: String, 
    default: "" 
  },
  file: { 
    type: String, 
    default: "" 
  },
  messageType: { 
    type: String, 
    enum: ["text", "image", "file", "system"],
    default: "text"
  },
  readBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    default: []
  }],
  reactions: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true
    },
    emoji: { 
      type: String, 
      required: true,
      trim: true
    },
    _id: false
  }],
  repliedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Message" 
  },
  deleted: { 
    type: Boolean, 
    default: false 
  },
  // ✅ NEW: Message status tracking
  status: {
    type: String,
    enum: ["sending", "sent", "delivered", "read", "failed"],
    default: "sent"
  },
  // ✅ NEW: Delivery tracking
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    },
    _id: false
  }],
  // ✅ NEW: Read tracking
  readByDetails: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    readAt: {
      type: Date,
      default: Date.now
    },
    _id: false
  }]
}, { 
  timestamps: true 
});

const chatSchema = new mongoose.Schema({
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }],
  lastMessage: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Message" 
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  },
  isGroupChat: { 
    type: Boolean, 
    default: false,
    index: true
  },
  groupName: { 
    type: String, 
    default: "",
    trim: true
  },
  groupAdmin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  typingUsers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    default: []
  }],
  // ✅ UPDATED: Backward compatibility with better structure
  messageHistory: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Message",
    default: []
  }],
  // ✅ NEW: Chat settings
  settings: {
    mute: {
      type: Boolean,
      default: false
    },
    archived: {
      type: Boolean,
      default: false
    },
    pinned: {
      type: Boolean,
      default: false
    }
  },
  // ✅ NEW: Last activity tracking
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // ✅ NEW: Chat metadata
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    deletedFor: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      deletedAt: {
        type: Date,
        default: Date.now
      },
      _id: false
    }]
  }
}, { 
  timestamps: true 
});

// ✅ Indexes for faster queries
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ "lastActivity": -1 });
chatSchema.index({ "settings.archived": 1, updatedAt: -1 });
chatSchema.index({ "settings.pinned": -1, updatedAt: -1 });

messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ "readBy": 1 });
messageSchema.index({ status: 1 });

// ✅ Virtual for unread count (for easier access)
chatSchema.virtual('unreadCount').get(function() {
  // This will be populated based on current user context
  return 0;
});

// ✅ Pre-save middleware for chat
chatSchema.pre('save', function(next) {
  // Update lastActivity when chat is modified
  this.lastActivity = new Date();
  
  // Ensure unreadCounts map is properly initialized for all participants
  if (this.isModified('participants')) {
    this.participants.forEach(participantId => {
      const participantStr = participantId.toString();
      if (!this.unreadCounts.has(participantStr)) {
        this.unreadCounts.set(participantStr, 0);
      }
    });
  }
  
  next();
});

// ✅ Pre-save middleware for message
messageSchema.pre('save', function(next) {
  // Update status based on readBy count
  if (this.readBy && this.readBy.length > 0) {
    this.status = "read";
  } else if (this.deliveredTo && this.deliveredTo.length > 0) {
    this.status = "delivered";
  } else {
    this.status = "sent";
  }
  
  next();
});

// ✅ Method to mark message as delivered
messageSchema.methods.markAsDelivered = async function(userId) {
  if (!this.deliveredTo.some(d => d.user.toString() === userId.toString())) {
    this.deliveredTo.push({
      user: userId,
      deliveredAt: new Date()
    });
    
    if (this.deliveredTo.length >= 1) { // For 1:1 chats
      this.status = "delivered";
    }
    
    return this.save();
  }
  return this;
};

// ✅ Method to mark message as read
messageSchema.methods.markAsRead = async function(userId) {
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
    this.readByDetails.push({
      user: userId,
      readAt: new Date()
    });
    
    this.status = "read";
    return this.save();
  }
  return this;
};

// ✅ Method to get other participant (for 1:1 chats)
chatSchema.methods.getOtherParticipant = function(currentUserId) {
  if (this.isGroupChat) return null;
  
  const otherParticipant = this.participants.find(
    participant => participant.toString() !== currentUserId.toString()
  );
  
  return otherParticipant;
};

// ✅ Method to get unread count for specific user
chatSchema.methods.getUnreadCountForUser = function(userId) {
  return this.unreadCounts.get(userId.toString()) || 0;
};

// ✅ Method to increment unread count for specific user
chatSchema.methods.incrementUnreadForUser = async function(userId) {
  const currentCount = this.unreadCounts.get(userId.toString()) || 0;
  this.unreadCounts.set(userId.toString(), currentCount + 1);
  return this.save();
};

// ✅ Method to reset unread count for specific user
chatSchema.methods.resetUnreadForUser = async function(userId) {
  this.unreadCounts.set(userId.toString(), 0);
  return this.save();
};

// ✅ Static method to find or create 1:1 chat
chatSchema.statics.findOrCreateChat = async function(user1Id, user2Id) {
  let chat = await this.findOne({
    participants: { $all: [user1Id, user2Id] },
    isGroupChat: false
  });
  
  if (!chat) {
    chat = new this({
      participants: [user1Id, user2Id],
      unreadCounts: new Map([
        [user1Id.toString(), 0],
        [user2Id.toString(), 0]
      ]),
      metadata: {
        createdBy: user1Id
      }
    });
    
    await chat.save();
  }
  
  return chat;
};

const Chat = mongoose.model("Chat", chatSchema);
const Message = mongoose.model("Message", messageSchema);

export { Chat, Message };