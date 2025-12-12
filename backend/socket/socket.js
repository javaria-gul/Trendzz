// backend/socket/socket.js

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { Chat, Message } from "../models/Chat.js";

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  const onlineUsers = new Map();
  const userSockets = new Map();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.log("❌ Socket connection: No token provided");
        return next(new Error("Authentication error: No token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("id name username avatar privacySettings onlineStatus");
      
      if (!user) {
        console.log("❌ Socket connection: User not found");
        return next(new Error("User not found"));
      }

      await User.findByIdAndUpdate(user.id, { 
        onlineStatus: 'online',
        lastSeen: new Date()
      });

      socket.userId = user.id;
      socket.user = user;
      
      console.log(`✅ Socket authenticated: ${user.name} (${user.id})`);
      next();
    } catch (error) {
      console.error("❌ Socket auth error:", error.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.userId} (Socket: ${socket.id})`);

    onlineUsers.set(socket.id, socket.userId);
    userSockets.set(socket.userId, socket.id);

    socket.broadcast.emit("user_online", {
      userId: socket.userId,
      user: socket.user
    });

    socket.join(socket.userId);

    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`👥 User ${socket.userId} joined chat ${chatId}`);
    });

    socket.on("leave_chat", (chatId) => {
      socket.leave(chatId);
      console.log(`👋 User ${socket.userId} left chat ${chatId}`);
    });

    socket.on("typing_start", async (data) => {
      const { chatId } = data;
      
      try {
        const chat = await Chat.findById(chatId);
        if (chat && !chat.typingUsers.includes(socket.userId)) {
          chat.typingUsers.push(socket.userId);
          await chat.save();
        }

        socket.to(chatId).emit("user_typing", {
          chatId,
          userId: socket.userId,
          user: socket.user
        });

        console.log(`⌨️ User ${socket.userId} started typing in chat ${chatId}`);
      } catch (error) {
        console.error("❌ Typing start error:", error);
      }
    });

    socket.on("typing_stop", async (data) => {
      const { chatId } = data;
      
      try {
        const chat = await Chat.findById(chatId);
        if (chat) {
          chat.typingUsers = chat.typingUsers.filter(id => id.toString() !== socket.userId);
          await chat.save();
        }

        socket.to(chatId).emit("user_stop_typing", {
          chatId,
          userId: socket.userId
        });

        console.log(`💤 User ${socket.userId} stopped typing in chat ${chatId}`);
      } catch (error) {
        console.error("❌ Typing stop error:", error);
      }
    });

    // ✅ FIXED: Handle new message with proper population
    socket.on("send_message", async (data) => {
      try {
        const { chatId, text, image, file, messageType, repliedTo } = data;

        console.log(`📨 Socket message received - Chat: ${chatId}, Sender: ${socket.userId}, Text: ${text}`);

        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(socket.userId)) {
          console.log(`❌ Chat not found or user not participant: ${chatId}`);
          return socket.emit("error", { message: "Chat not found" });
        }

        // Create message
        const message = new Message({
          chat: chatId,
          sender: socket.userId,
          text,
          image,
          file,
          messageType: messageType || "text",
          repliedTo
        });

        await message.save();

        // ✅ CRITICAL FIX: Properly populate message using findById
        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "_id name username avatar")
          .populate("repliedTo");

        console.log(`✅ Message populated - Sender: ${populatedMessage.sender?.name}, ID: ${populatedMessage.sender?._id}`);

        // Update chat with populated message
        chat.lastMessage = populatedMessage._id;
        
        // Update unread counts
        chat.participants.forEach(participantId => {
          if (participantId.toString() !== socket.userId) {
            const currentCount = chat.unreadCounts.get(participantId.toString()) || 0;
            chat.unreadCounts.set(participantId.toString(), currentCount + 1);
          }
        });
        
        await chat.save();

        // ✅ FIXED: Emit to chat room with PROPERLY POPULATED data
        io.to(chatId).emit("new_message", {
          chatId,
          message: populatedMessage  // ✅ populatedMessage bhejo
        });

        console.log(`📢 Message broadcasted to chat ${chatId}`);

        // Emit chat update
        chat.participants.forEach(participantId => {
          io.to(participantId.toString()).emit("chat_updated", {
            chatId,
            lastMessage: populatedMessage,  // ✅ yahan bhi populatedMessage
            unreadCount: chat.unreadCounts.get(participantId.toString()) || 0
          });
        });

      } catch (error) {
        console.error("❌ Send message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("react_to_message", async (data) => {
      try {
        const { messageId, emoji } = data;
        
        console.log(`❤️ Reaction received - Message: ${messageId}, Emoji: ${emoji}`);
        
        const message = await Message.findById(messageId);
        if (!message) {
          console.log(`❌ Message not found: ${messageId}`);
          return;
        }

        message.reactions = message.reactions.filter(
          reaction => reaction.user.toString() !== socket.userId
        );

        message.reactions.push({
          user: socket.userId,
          emoji
        });

        await message.save();
        await message.populate("reactions.user", "name username");

        console.log(`✅ Reaction saved for message ${messageId}`);

        const chat = await Chat.findById(message.chat);
        socket.to(chat._id.toString()).emit("message_reacted", {
          messageId,
          reactions: message.reactions
        });

      } catch (error) {
        console.error("❌ Reaction error:", error);
      }
    });

    socket.on("disconnect", async () => {
      console.log(`🔌 User disconnected: ${socket.userId} (Socket: ${socket.id})`);

      await User.findByIdAndUpdate(socket.userId, { 
        onlineStatus: 'offline',
        lastSeen: new Date()
      });

      onlineUsers.delete(socket.id);
      userSockets.delete(socket.userId);

      socket.broadcast.emit("user_offline", {
        userId: socket.userId
      });

      console.log(`📢 User ${socket.userId} status updated to offline`);
    });
  });

  return io;
};

export default setupSocket;