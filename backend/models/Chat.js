// backend/models/Chat.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, default: "" },
  image: { type: String, default: "" },
  file: { type: String, default: "" },
  messageType: { 
    type: String, 
    enum: ["text", "image", "file", "system"],
    default: "text"
  },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    emoji: { type: String, required: true }
  }],
  repliedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  },
  isGroupChat: { type: Boolean, default: false },
  groupName: { type: String, default: "" },
  groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  typingUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

// Index for faster queries
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

const Chat = mongoose.model("Chat", chatSchema);
const Message = mongoose.model("Message", messageSchema);

export { Chat, Message };