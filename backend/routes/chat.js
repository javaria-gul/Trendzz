// backend/routes/chat.js

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
    .populate("participants", "name username avatar role onlineStatus")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

    console.log(`✅ Found ${chats.length} chats for user ${req.user._id}`);

    res.json({ 
      success: true, 
      data: chats 
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
    const receiver = await User.findById(receiverId);
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
    .populate("participants", "name username avatar role onlineStatus")
    .populate("lastMessage");

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
      .populate("participants", "name username avatar role onlineStatus")
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

// Get messages for a chat - ENHANCED DEBUGGING
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
        message: "Chat not found" 
      });
    }

    const messages = await Message.find({ 
      chat: chatId,
      deleted: false 
    })
    .populate("sender", "name username avatar")
    .populate("repliedTo")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    console.log(`✅ Found ${messages.length} messages for chat ${chatId}`);
    
    // DEBUG: Log first message details
    if (messages.length > 0) {
      console.log('🔍 First message sample:', {
        id: messages[0]._id,
        text: messages[0].text,
        sender: messages[0].sender?.name,
        chat: messages[0].chat,
        createdAt: messages[0].createdAt
      });
    }

    res.json({ 
      success: true, 
      data: messages.reverse(),
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
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

// Send message - ENHANCED WITH CHAT FIELD VERIFICATION
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

    // VERIFY: Ensure chat field is properly set
    const message = new Message({
      chat: chatId, // ✅ CRITICAL: This must be set
      sender: req.user._id,
      text,
      image,
      file,
      messageType: messageType || "text",
      repliedTo
    });

    await message.save();

    // DEBUG: Verify message was saved with chat field
    const savedMessage = await Message.findById(message._id);
    console.log(`✅ Message saved: ${savedMessage._id}, Chat: ${savedMessage.chat}`);

    // Update chat's last message
    chat.lastMessage = message._id;
    
    // Update unread counts for other participants
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== req.user._id.toString()) {
        const currentCount = chat.unreadCounts.get(participantId.toString()) || 0;
        chat.unreadCounts.set(participantId.toString(), currentCount + 1);
      }
    });
    
    await chat.save();

    // Populate message before sending
    await message.populate("sender", "name username avatar");
    await message.populate("repliedTo");

    console.log(`✅ Message populated and ready: ${message._id}`);

    res.json({ 
      success: true, 
      data: message 
    });
  } catch (error) {
    console.error("❌ Send message error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Mark messages as read
router.put("/chats/:chatId/read", requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    console.log(`👀 Marking messages as read for chat: ${chatId}`);

    const chat = await Chat.findById(chatId);
    if (chat) {
      chat.unreadCounts.set(req.user._id.toString(), 0);
      await chat.save();
    }

    await Message.updateMany(
      { 
        chat: chatId, 
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id }
      },
      { $addToSet: { readBy: req.user._id } }
    );

    console.log(`✅ Messages marked as read for chat: ${chatId}`);

    res.json({ 
      success: true, 
      message: "Messages marked as read" 
    });
  } catch (error) {
    console.error("❌ Mark as read error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Delete message
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

    res.json({ 
      success: true, 
      message: "Reaction added",
      reactions: message.reactions 
    });
  } catch (error) {
    console.error("❌ React to message error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;