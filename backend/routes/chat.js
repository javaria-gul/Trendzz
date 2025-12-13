import express from "express";
import { Chat, Message } from "../models/Chat.js";
import User from "../models/User.js";
import requireAuth from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all chats for a user
router.get("/chats", requireAuth, async (req, res) => {
  try {
    const chats = await Chat.find({ 
      participants: req.user._id 
    })
    .populate("participants", "name username avatar role onlineStatus lastSeen")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name username avatar"
      }
    })
    .sort({ updatedAt: -1 });

    console.log(`✅ Found ${chats.length} chats for user ${req.user._id}`);

    // Calculate unread counts for current user
    const chatsWithUnread = chats.map(chat => {
      const unreadCount = chat.unreadCounts?.get(req.user._id.toString()) || 0;
      return {
        ...chat.toObject(),
        unreadCount // For easier frontend access
      };
    });

    res.json({ 
      success: true, 
      data: chatsWithUnread 
    });
  } catch (error) {
    console.error("❌ Get chats error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get or create chat with another user
router.post("/chats/start", requireAuth, async (req, res) => {
  try {
    const { receiverId } = req.body;
    
    console.log(`💬 Starting chat - User: ${req.user._id}, Receiver: ${receiverId}`);
    
    // Check if receiver exists
    const receiver = await User.findById(receiverId).select("name username avatar privacySettings followers onlineStatus lastSeen");
    if (!receiver) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    // Check privacy settings
    if (!receiver.privacySettings?.allowMessages && !receiver.followers.includes(req.user._id)) {
      return res.status(403).json({ 
        success: false, 
        message: "This user doesn't allow messages from non-followers" 
      });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, receiverId] },
      isGroupChat: false
    })
    .populate("participants", "name username avatar role onlineStatus lastSeen")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name username avatar"
      }
    });

    if (chat) {
      console.log(`✅ Existing chat found: ${chat._id}`);
      return res.json({ 
        success: true, 
        data: chat 
      });
    }

    // Create new chat
    console.log(`🆕 Creating new chat between ${req.user._id} and ${receiverId}`);
    chat = new Chat({
      participants: [req.user._id, receiverId],
      unreadCounts: new Map([
        [req.user._id.toString(), 0],
        [receiverId.toString(), 0]
      ])
    });

    await chat.save();
    
    // Populate again after save
    chat = await Chat.findById(chat._id)
      .populate("participants", "name username avatar role onlineStatus lastSeen")
      .populate("lastMessage");

    console.log(`✅ New chat created: ${chat._id}`);

    res.json({ 
      success: true, 
      data: chat 
    });
  } catch (error) {
    console.error("❌ Start chat error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get messages for a chat - ENHANCED VERSION
router.get("/chats/:chatId/messages", requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    console.log(`📨 Fetching messages for chat: ${chatId}, page: ${page}`);

    // Check if user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user._id)) {
      return res.status(404).json({ 
        success: false, 
        message: "Chat not found or access denied" 
      });
    }

    // Fetch messages with chat field
    let messages = await Message.find({ 
      chat: chatId,
      deleted: false 
    })
    .populate("sender", "name username avatar")
    .populate({
      path: "repliedTo",
      populate: {
        path: "sender",
        select: "name username avatar"
      }
    })
    .populate("reactions.user", "name username avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    console.log(`🔍 Found ${messages.length} messages for chat ${chatId}`);

    // Mark messages as read (only for messages sent by others)
    const unreadMessages = messages.filter(msg => 
      msg.sender._id.toString() !== req.user._id.toString() &&
      !msg.readBy.includes(req.user._id)
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg._id);
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $addToSet: { readBy: req.user._id } }
      );

      // Update unread count in chat
      const currentUnread = chat.unreadCounts.get(req.user._id.toString()) || 0;
      const newUnread = Math.max(0, currentUnread - unreadMessages.length);
      chat.unreadCounts.set(req.user._id.toString(), newUnread);
      await chat.save();

      console.log(`✅ Marked ${unreadMessages.length} messages as read`);
    }

    // Update read status in returned messages
    messages = messages.map(msg => ({
      ...msg.toObject(),
      read: msg.readBy.includes(req.user._id)
    }));

    res.json({ 
      success: true, 
      data: messages.reverse(),
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit,
        totalUnread: chat.unreadCounts.get(req.user._id.toString()) || 0
      }
    });
  } catch (error) {
    console.error("❌ Get messages error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Send message - ENHANCED VERSION
router.post("/chats/:chatId/messages", requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text, image, file, messageType, repliedTo } = req.body;

    console.log(`📤 Sending message to chat: ${chatId}`, { text });

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user._id)) {
      return res.status(404).json({ 
        success: false, 
        message: "Chat not found" 
      });
    }

    // Create message
    const message = new Message({
      chat: chatId,
      sender: req.user._id,
      text,
      image,
      file,
      messageType: messageType || "text",
      repliedTo,
      readBy: [req.user._id] // Sender automatically reads their own message
    });

    await message.save();

    // Populate message
    await message.populate("sender", "name username avatar");
    await message.populate({
      path: "repliedTo",
      populate: {
        path: "sender",
        select: "name username avatar"
      }
    });

    // Update chat
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    
    // Increment unread counts for other participants
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== req.user._id.toString()) {
        const currentCount = chat.unreadCounts.get(participantId.toString()) || 0;
        chat.unreadCounts.set(participantId.toString(), currentCount + 1);
      }
    });
    
    await chat.save();

    console.log(`✅ Message sent: ${message._id}`);

    res.json({ 
      success: true, 
      data: {
        ...message.toObject(),
        read: true // For sender, message is always read
      }
    });
  } catch (error) {
    console.error("❌ Send message error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Mark all messages as read in a chat
router.put("/chats/:chatId/read", requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    console.log(`👀 Marking all messages as read for chat: ${chatId}, User: ${req.user._id}`);

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user._id)) {
      return res.status(404).json({ 
        success: false, 
        message: "Chat not found" 
      });
    }

    // Reset unread count for this user
    chat.unreadCounts.set(req.user._id.toString(), 0);
    await chat.save();

    // Mark all unread messages from others as read
    const result = await Message.updateMany(
      { 
        chat: chatId, 
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id }
      },
      { $addToSet: { readBy: req.user._id } }
    );

    console.log(`✅ Marked ${result.modifiedCount} messages as read for chat: ${chatId}`);

    res.json({ 
      success: true, 
      message: "All messages marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("❌ Mark as read error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Mark single message as read
router.put("/messages/:messageId/read", requireAuth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: "Message not found" 
      });
    }

    // Check if user is participant in the chat
    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.participants.includes(req.user._id)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    // Add user to readBy if not already
    if (!message.readBy.includes(req.user._id)) {
      message.readBy.push(req.user._id);
      await message.save();

      // Update unread count in chat
      const currentUnread = chat.unreadCounts.get(req.user._id.toString()) || 0;
      chat.unreadCounts.set(req.user._id.toString(), Math.max(0, currentUnread - 1));
      await chat.save();
    }

    res.json({ 
      success: true, 
      message: "Message marked as read",
      data: message
    });
  } catch (error) {
    console.error("❌ Mark message read error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Delete message (soft delete)
router.delete("/messages/:messageId", requireAuth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: "Message not found" 
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only delete your own messages" 
      });
    }

    // Soft delete
    message.deleted = true;
    message.text = "[This message was deleted]";
    message.image = "";
    message.file = "";
    await message.save();

    res.json({ 
      success: true, 
      message: "Message deleted" 
    });
  } catch (error) {
    console.error("❌ Delete message error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// React to message
router.post("/messages/:messageId/react", requireAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: "Message not found" 
      });
    }

    // Check if user is participant in the chat
    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.participants.includes(req.user._id)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      reaction => reaction.user.toString() !== req.user._id.toString()
    );

    // Add new reaction
    message.reactions.push({
      user: req.user._id,
      emoji
    });

    await message.save();
    await message.populate("reactions.user", "name username avatar");

    res.json({ 
      success: true, 
      message: "Reaction added",
      data: message.reactions 
    });
  } catch (error) {
    console.error("❌ React to message error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ✅ NEW: Delete chat (hard delete)
router.delete("/chats/:chatId", requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    console.log(`🗑️ Deleting chat: ${chatId}, User: ${req.user._id}`);

    // Check if chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user._id)) {
      return res.status(404).json({ 
        success: false, 
        message: "Chat not found" 
      });
    }

    // Delete all messages in this chat
    await Message.deleteMany({ chat: chatId });
    
    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    console.log(`✅ Chat ${chatId} deleted successfully`);

    res.json({ 
      success: true, 
      message: "Chat deleted successfully" 
    });
  } catch (error) {
    console.error("❌ Delete chat error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ✅ NEW: Get chat info
router.get("/chats/:chatId/info", requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate("participants", "name username avatar onlineStatus lastSeen followers following")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name username avatar"
        }
      });

    if (!chat || !chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(404).json({ 
        success: false, 
        message: "Chat not found" 
      });
    }

    // Get other participant
    const otherParticipant = chat.participants.find(p => p._id.toString() !== req.user._id.toString());

    res.json({ 
      success: true, 
      data: {
        chat,
        otherParticipant,
        unreadCount: chat.unreadCounts.get(req.user._id.toString()) || 0
      }
    });
  } catch (error) {
    console.error("❌ Get chat info error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;