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
      participants: req.user.id 
    })
    .populate("participants", "name username avatar role")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

    res.json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get or create chat with another user
router.post("/chats/start", requireAuth, async (req, res) => {
  try {
    const { receiverId } = req.body;
    
    // Check if receiver exists and allows messages
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    if (!receiver.privacySettings.allowMessages && !receiver.followers.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: "This user doesn't allow messages" });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, receiverId] },
      isGroupChat: false
    })
    .populate("participants", "name username avatar role onlineStatus")
    .populate("lastMessage");

    if (!chat) {
      chat = new Chat({
        participants: [req.user.id, receiverId],
        unreadCounts: new Map([[req.user.id, 0], [receiverId, 0]])
      });
      await chat.save();
      
      // Populate again after save
      chat = await Chat.findById(chat._id)
        .populate("participants", "name username avatar role onlineStatus")
        .populate("lastMessage");
    }

    res.json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get messages for a chat
router.get("/chats/:chatId/messages", requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ 
      chat: chatId,
      deleted: false 
    })
    .populate("sender", "name username avatar")
    .populate("repliedTo")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send message
router.post("/chats/:chatId/messages", requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text, image, file, messageType, repliedTo } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user.id)) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    const message = new Message({
      chat: chatId,
      sender: req.user.id,
      text,
      image,
      file,
      messageType: messageType || "text",
      repliedTo
    });

    await message.save();

    // Update chat's last message
    chat.lastMessage = message._id;
    
    // Update unread counts for other participants
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id) {
        const currentCount = chat.unreadCounts.get(participantId.toString()) || 0;
        chat.unreadCounts.set(participantId.toString(), currentCount + 1);
      }
    });
    
    await chat.save();

    // Populate message before sending
    await message.populate("sender", "name username avatar");
    await message.populate("repliedTo");

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark messages as read
router.put("/chats/:chatId/read", requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId);
    if (chat) {
      chat.unreadCounts.set(req.user.id, 0);
      await chat.save();
    }

    await Message.updateMany(
      { 
        chat: chatId, 
        sender: { $ne: req.user.id },
        readBy: { $ne: req.user.id }
      },
      { $addToSet: { readBy: req.user.id } }
    );

    res.json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;