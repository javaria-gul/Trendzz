import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { Chat, Message } from "../models/Chat.js";
import Post from "../models/Post.js"; // ✅ Added

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  const onlineUsers = new Map();
  const userSockets = new Map();

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("id name username avatar privacySettings onlineStatus");
      
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket auth error:", error);
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

    // ✅ NEW: Join user to feed room for real-time posts
    socket.join("feed_room");

    // ✅ NEW: Join user to post rooms they're interested in
    socket.on("join_post_room", (postId) => {
      if (postId) {
        socket.join(`post_${postId}`);
        console.log(`User ${socket.userId} joined post room: ${postId}`);
      }
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

    // ✅ NEW: Handle new post creation
    socket.on("new_post", async (postData) => {
      try {
        console.log("📢 New post event received:", postData._id);
        
        // ✅ Broadcast to all users in feed room (except sender)
        socket.broadcast.to("feed_room").emit("post_created", {
          type: "NEW_POST",
          post: postData,
          timestamp: new Date()
        });
        
        console.log(`📢 Post ${postData._id} broadcasted to feed room`);
      } catch (error) {
        console.error("New post broadcast error:", error);
      }
    });

    // ✅ NEW: Handle post like/unlike
    socket.on("post_liked", async (data) => {
      try {
        const { postId, userId, reactionType, likesCount, isLiked } = data;
        
        // ✅ Broadcast to post room
        socket.broadcast.to(`post_${postId}`).emit("post_like_updated", {
          type: "LIKE_UPDATE",
          postId,
          userId,
          reactionType,
          likesCount,
          isLiked,
          timestamp: new Date()
        });
        
        // ✅ Also update feed for real-time count
        io.to("feed_room").emit("feed_updated", {
          type: "POST_LIKED",
          postId,
          likesCount,
          timestamp: new Date()
        });
        
        console.log(`❤️ Like update for post ${postId}: ${reactionType}`);
      } catch (error) {
        console.error("Post like broadcast error:", error);
      }
    });

    // ✅ NEW: Handle comment added
    socket.on("new_comment", async (data) => {
      try {
        const { postId, comment, commentCount } = data;
        
        // ✅ Broadcast to post room
        socket.broadcast.to(`post_${postId}`).emit("comment_added", {
          type: "NEW_COMMENT",
          postId,
          comment,
          commentCount,
          timestamp: new Date()
        });
        
        console.log(`💬 New comment on post ${postId}`);
      } catch (error) {
        console.error("New comment broadcast error:", error);
      }
    });

    // ✅ NEW: Handle post deletion
    socket.on("post_deleted", async (data) => {
      try {
        const { postId, deletedBy } = data;
        
        // ✅ Broadcast to feed room
        io.to("feed_room").emit("post_removed", {
          type: "POST_DELETED",
          postId,
          deletedBy,
          timestamp: new Date()
        });
        
        console.log(`🗑️ Post ${postId} deleted by ${deletedBy}`);
      } catch (error) {
        console.error("Post deletion broadcast error:", error);
      }
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

  // ✅ NEW: Export function to emit events from controllers
  const emitPostCreated = (post) => {
    console.log("🚀 Emitting post_created event");
    io.to("feed_room").emit("post_created", {
      type: "NEW_POST",
      post,
      timestamp: new Date()
    });
  };

  const emitPostLiked = (data) => {
    const { postId, userId, reactionType, likesCount, isLiked } = data;
    io.to(`post_${postId}`).emit("post_like_updated", {
      type: "LIKE_UPDATE",
      postId,
      userId,
      reactionType,
      likesCount,
      isLiked,
      timestamp: new Date()
    });
  };

  const emitCommentAdded = (data) => {
    const { postId, comment, commentCount } = data;
    io.to(`post_${postId}`).emit("comment_added", {
      type: "NEW_COMMENT",
      postId,
      comment,
      commentCount,
      timestamp: new Date()
    });
  };

  const emitPostDeleted = (postId, deletedBy) => {
    io.to("feed_room").emit("post_removed", {
      type: "POST_DELETED",
      postId,
      deletedBy,
      timestamp: new Date()
    });
  };

  return {
    io,
    emitPostCreated,
    emitPostLiked,
    emitCommentAdded,
    emitPostDeleted
  };
};

export default setupSocket;