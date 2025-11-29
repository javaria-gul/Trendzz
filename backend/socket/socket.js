// backend/socket/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { Chat, Message } from "../models/Chat.js";

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  const onlineUsers = new Map(); // socketId -> userId
  const userSockets = new Map(); // userId -> socketId

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("id name username avatar privacySettings");
      
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.userId);

    // Add user to online users
    onlineUsers.set(socket.id, socket.userId);
    userSockets.set(socket.userId, socket.id);

    // Broadcast online status
    socket.broadcast.emit("user_online", {
      userId: socket.userId,
      user: socket.user
    });

    // Join user to their personal room
    socket.join(socket.userId);

    // Handle joining chat room
    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    });

    // Handle leaving chat room
    socket.on("leave_chat", (chatId) => {
      socket.leave(chatId);
    });

    // Handle typing events
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
      } catch (error) {
        console.error("Typing start error:", error);
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
      } catch (error) {
        console.error("Typing stop error:", error);
      }
    });

    // Handle new message
    socket.on("send_message", async (data) => {
      try {
        const { chatId, text, image, file, messageType, repliedTo } = data;

        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(socket.userId)) {
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

        // Update chat
        chat.lastMessage = message._id;
        
        // Update unread counts
        chat.participants.forEach(participantId => {
          if (participantId.toString() !== socket.userId) {
            const currentCount = chat.unreadCounts.get(participantId.toString()) || 0;
            chat.unreadCounts.set(participantId.toString(), currentCount + 1);
          }
        });
        
        await chat.save();

        // Populate message
        await message.populate("sender", "name username avatar");
        await message.populate("repliedTo");

        // Emit to all participants in the chat
        io.to(chatId).emit("new_message", {
          message,
          chatId
        });

        // Emit chat update to all participants
        chat.participants.forEach(participantId => {
          io.to(participantId.toString()).emit("chat_updated", {
            chatId,
            lastMessage: message,
            unreadCount: chat.unreadCounts.get(participantId.toString()) || 0
          });
        });

      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle message reactions
    socket.on("react_to_message", async (data) => {
      try {
        const { messageId, emoji } = data;
        
        const message = await Message.findById(messageId);
        if (!message) return;

        // Remove existing reaction from this user
        message.reactions = message.reactions.filter(
          reaction => reaction.user.toString() !== socket.userId
        );

        // Add new reaction
        message.reactions.push({
          user: socket.userId,
          emoji
        });

        await message.save();
        await message.populate("reactions.user", "name username");

        // Broadcast reaction to chat
        const chat = await Chat.findById(message.chat);
        socket.to(chat._id.toString()).emit("message_reacted", {
          messageId,
          reactions: message.reactions
        });

      } catch (error) {
        console.error("Reaction error:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.userId);

      onlineUsers.delete(socket.id);
      userSockets.delete(socket.userId);

      // Broadcast offline status
      socket.broadcast.emit("user_offline", {
        userId: socket.userId
      });
    });
  });

  return io;
};

export default setupSocket;