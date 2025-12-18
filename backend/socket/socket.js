import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { Chat, Message } from "../models/Chat.js";
import { createNotificationSafely } from '../utils/notificationHelper.js';

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  const onlineUsers = new Map(); // socketId -> userId
  const userSockets = new Map(); // userId -> socketId
  const userRooms = new Map(); // userId -> [roomIds]

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.log("❌ Socket connection: No token provided");
        return next(new Error("Authentication error: No token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("id name username avatar privacySettings onlineStatus lastSeen");
      
      if (!user) {
        console.log("❌ Socket connection: User not found");
        return next(new Error("User not found"));
      }

      // Update user online status
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

    // Store user connection
    onlineUsers.set(socket.id, socket.userId);
    userSockets.set(socket.userId, socket.id);
    userRooms.set(socket.userId, []);
    
    // Join user's personal rooms (legacy id and namespaced) for compatibility
    try {
      socket.join(socket.userId);
      socket.join(`user:${socket.userId}`);
    } catch (e) {
      console.error('❌ Error joining user rooms:', e.message);
    }

    // Broadcast user online status
    socket.broadcast.emit("user_online", {
      userId: socket.userId,
      user: {
        _id: socket.user._id,
        name: socket.user.name,
        username: socket.user.username,
        avatar: socket.user.avatar,
        onlineStatus: 'online'
      }
    });

    // (already joined above) ensure room membership logged
    console.log(`📥 User ${socket.userId} joined personal rooms: [${socket.userId}, user:${socket.userId}]`);

    socket.on("join_chat", (data) => {
      const { chatId } = data;
      socket.join(chatId);
      
      const currentRooms = userRooms.get(socket.userId) || [];
      if (!currentRooms.includes(chatId)) {
        userRooms.set(socket.userId, [...currentRooms, chatId]);
      }
      
      console.log(`👥 User ${socket.userId} joined chat ${chatId}`);
    });

    socket.on("leave_chat", (data) => {
      const { chatId } = data;
      socket.leave(chatId);
      
      const currentRooms = userRooms.get(socket.userId) || [];
      userRooms.set(socket.userId, currentRooms.filter(room => room !== chatId));
      
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
          user: {
            _id: socket.user._id,
            name: socket.user.name,
            username: socket.user.username,
            avatar: socket.user.avatar
          }
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

    // ✅ FIXED: Handle new message with proper delivery status
    socket.on("send_message", async (data) => {
      try {
        const { chatId, text, image, file, messageType, repliedTo, tempId } = data;

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
          repliedTo,
          readBy: [socket.userId] // Sender automatically reads the message
        });

        await message.save();

        // ✅ CRITICAL: Properly populate message
        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "_id name username avatar")
          .populate("repliedTo");

        console.log(`✅ Message saved: ${populatedMessage._id}, Sender: ${populatedMessage.sender?.name}`);

        // ✅ STEP 1: Send confirmation to sender that message was sent
        io.to(socket.userId).emit("message_sent", {
          chatId,
          messageId: populatedMessage._id,
          tempId: tempId || null
        });

        // Update chat with populated message
        chat.lastMessage = populatedMessage._id;
        
        // Update unread counts for other participants
        chat.participants.forEach(participantId => {
          if (participantId.toString() !== socket.userId) {
            const currentCount = chat.unreadCounts.get(participantId.toString()) || 0;
            chat.unreadCounts.set(participantId.toString(), currentCount + 1);
          }
        });
        
        await chat.save();

        // ✅ STEP 2: Broadcast new message to chat room
        io.to(chatId).emit("new_message", {
          chatId,
          message: populatedMessage
        });

        console.log(`📢 Message broadcasted to chat ${chatId}`);

          // ✅ STEP 5: Create message notifications for other participants (non-blocking)
          try {
            const recipients = chat.participants.filter(pid => pid.toString() !== socket.userId);
            const notifyPromises = recipients.map(recipientId =>
              createNotificationSafely({
                recipientId,
                senderId: socket.userId,
                type: 'message',
                io,
                data: { text: (text || '').substring(0, 100), chatId }
              }).catch(err => console.error('Message notify error:', err.message))
            );
            // Fire and forget
            Promise.allSettled(notifyPromises).then(() => {
              console.log('📬 Message notification attempts completed');
            });
          } catch (notifyErr) {
            console.error('❌ Message notification scheduling failed:', notifyErr.message);
          }

        // ✅ STEP 3: Emit chat update to all participants
        chat.participants.forEach(participantId => {
          const participantSocketId = userSockets.get(participantId.toString());
          if (participantSocketId) {
            io.to(participantId.toString()).emit("chat_updated", {
              chatId,
              lastMessage: populatedMessage,
              unreadCount: chat.unreadCounts.get(participantId.toString()) || 0
            });
          }
        });

        // ✅ STEP 4: Simulate delivered status after 1 second
        setTimeout(() => {
          chat.participants.forEach(participantId => {
            if (participantId.toString() !== socket.userId) {
              const participantSocketId = userSockets.get(participantId.toString());
              if (participantSocketId) {
                // Emit to recipient that message was delivered
                io.to(participantId.toString()).emit("message_delivered", {
                  chatId,
                  messageId: populatedMessage._id
                });
                
                // Emit to sender that message was delivered to recipient
                io.to(socket.userId).emit("message_delivered", {
                  chatId,
                  messageId: populatedMessage._id,
                  toUserId: participantId.toString()
                });
              }
            }
          });
        }, 1000);

      } catch (error) {
        console.error("❌ Send message error:", error);
        socket.emit("error", { 
          message: "Failed to send message",
          error: error.message 
        });
      }
    });

    // Handle message read status
    socket.on("mark_as_read", async (data) => {
      try {
        const { chatId, messageId } = data;
        
        console.log(`👀 Mark as read - Chat: ${chatId}, Message: ${messageId}`);
        
        const message = await Message.findById(messageId);
        if (!message) {
          console.log(`❌ Message not found: ${messageId}`);
          return;
        }

        // Add user to readBy array if not already there
        if (!message.readBy.includes(socket.userId)) {
          message.readBy.push(socket.userId);
          await message.save();
        }

        // Update chat unread count
        const chat = await Chat.findById(chatId);
        if (chat) {
          chat.unreadCounts.set(socket.userId.toString(), 0);
          await chat.save();
        }

        // Emit to sender that message was read
        const senderSocketId = userSockets.get(message.sender.toString());
        if (senderSocketId) {
          io.to(message.sender.toString()).emit("message_read", {
            chatId,
            messageId: message._id,
            readByUserId: socket.userId
          });
        }

        console.log(`✅ Message ${messageId} marked as read by ${socket.userId}`);

      } catch (error) {
        console.error("❌ Mark as read error:", error);
      }
    });

    // React to message
    socket.on("react_to_message", async (data) => {
      try {
        const { messageId, emoji } = data;
        
        console.log(`❤️ Reaction received - Message: ${messageId}, Emoji: ${emoji}`);
        
        const message = await Message.findById(messageId);
        if (!message) {
          console.log(`❌ Message not found: ${messageId}`);
          return;
        }

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
        await message.populate("reactions.user", "name username avatar");

        console.log(`✅ Reaction saved for message ${messageId}`);

        const chat = await Chat.findById(message.chat);
        if (chat) {
          io.to(chat._id.toString()).emit("message_reacted", {
            messageId,
            reactions: message.reactions
          });
        }

      } catch (error) {
        console.error("❌ Reaction error:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`🔌 User disconnected: ${socket.userId} (Socket: ${socket.id})`);

      try {
        // Update user offline status
        await User.findByIdAndUpdate(socket.userId, { 
          onlineStatus: 'offline',
          lastSeen: new Date()
        });

        // Remove from online maps
        onlineUsers.delete(socket.id);
        userSockets.delete(socket.userId);
        userRooms.delete(socket.userId);

        // Leave rooms explicitly
        try {
          socket.leave(socket.userId);
          socket.leave(`user:${socket.userId}`);
        } catch (e) {
          // ignore
        }

        // Broadcast user offline status
        socket.broadcast.emit("user_offline", {
          userId: socket.userId,
          lastSeen: new Date()
        });

        console.log(`📢 User ${socket.userId} status updated to offline`);

      } catch (error) {
        console.error("❌ Disconnect error:", error);
      }
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error(`❌ Connection error for user ${socket.userId}:`, error.message);
    });
  });

  // Heartbeat to keep connections alive
  setInterval(() => {
    io.emit("ping", { timestamp: Date.now() });
  }, 30000);

  // Attach maps for external inspection (debug endpoints/controllers can read these)
  io.onlineUsers = onlineUsers; // socketId -> userId
  io.userSockets = userSockets; // userId -> socketId
  io.userRooms = userRooms; // userId -> [roomIds]

  console.log(`📡 Socket diagnostics attached: onlineUsers=${onlineUsers.size} connections`);

  return io;
};

export default setupSocket;