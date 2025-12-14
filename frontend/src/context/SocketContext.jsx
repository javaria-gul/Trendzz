import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

// Create Context
export const SocketContext = createContext();

// Socket Provider
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { userToken, userData } = useContext(AuthContext);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (userToken && userData) {
      console.log('🔄 Initializing socket connection...');
      
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: userToken
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to server, Socket ID:', newSocket.id);
        setSocket(newSocket);
        setIsConnected(true);
        
        // ✅ JOIN FEED ROOM FOR POST UPDATES
        newSocket.emit('join_post_room', 'feed_room');
        console.log('📢 Joined feed room for real-time posts');
      });

      newSocket.on('user_online', (data) => {
        console.log('👤 User online:', data.userId);
        setOnlineUsers(prev => [...prev, data.userId]);
      });

      newSocket.on('user_offline', (data) => {
        console.log('👤 User offline:', data.userId);
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      });

      // ✅ NEW: POST CREATED EVENT
      newSocket.on('post_created', (data) => {
        console.log('📢 New post created via socket:', data.post._id);
        // This event will be handled in HomeFeed component
        window.dispatchEvent(new CustomEvent('post_created', { detail: data }));
      });

      // ✅ NEW: POST LIKE UPDATED EVENT
      newSocket.on('post_like_updated', (data) => {
        console.log('❤️ Post like updated via socket:', data.postId);
        window.dispatchEvent(new CustomEvent('post_like_updated', { detail: data }));
      });

      // ✅ NEW: COMMENT ADDED EVENT
      newSocket.on('comment_added', (data) => {
        console.log('💬 New comment added via socket:', data.postId);
        window.dispatchEvent(new CustomEvent('comment_added', { detail: data }));
      });

      // ✅ NEW: POST DELETED EVENT
      newSocket.on('post_removed', (data) => {
        console.log('🗑️ Post removed via socket:', data.postId);
        window.dispatchEvent(new CustomEvent('post_removed', { detail: data }));
      });

      // ✅ NEW: FEED UPDATED EVENT (for general updates)
      newSocket.on('feed_updated', (data) => {
        console.log('🔄 Feed updated via socket:', data.type);
        window.dispatchEvent(new CustomEvent('feed_updated', { detail: data }));
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setIsConnected(false);
      });

      return () => {
        console.log('🔄 Cleaning up socket connection...');
        if (newSocket) {
          newSocket.disconnect();
        }
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [userToken, userData]);

  // ✅ Helper function to join specific post room
  const joinPostRoom = (postId) => {
    if (socket && postId) {
      socket.emit('join_post_room', postId);
      console.log(`📢 Joined post room: ${postId}`);
    }
  };

  // ✅ Helper function to leave post room
  const leavePostRoom = (postId) => {
    if (socket && postId) {
      socket.emit('leave_chat', `post_${postId}`);
      console.log(`📢 Left post room: ${postId}`);
    }
  };

  // ✅ Helper function to emit new post event
  const emitNewPost = (postData) => {
    if (socket) {
      socket.emit('new_post', postData);
      console.log('📢 Emitted new_post event:', postData._id);
    }
  };

  // ✅ Helper function to emit post liked event
  const emitPostLiked = (postId, userId, reactionType, likesCount, isLiked) => {
    if (socket) {
      socket.emit('post_liked', {
        postId,
        userId,
        reactionType,
        likesCount,
        isLiked
      });
      console.log('❤️ Emitted post_liked event:', postId);
    }
  };

  // ✅ Helper function to emit new comment event
  const emitNewComment = (postId, comment, commentCount) => {
    if (socket) {
      socket.emit('new_comment', {
        postId,
        comment,
        commentCount
      });
      console.log('💬 Emitted new_comment event:', postId);
    }
  };

  // ✅ Helper function to emit post deleted event
  const emitPostDeleted = (postId, deletedBy) => {
    if (socket) {
      socket.emit('post_deleted', {
        postId,
        deletedBy
      });
      console.log('🗑️ Emitted post_deleted event:', postId);
    }
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      onlineUsers, 
      isConnected,
      joinPostRoom,
      leavePostRoom,
      emitNewPost,
      emitPostLiked,
      emitNewComment,
      emitPostDeleted
    }}>
      {children}
    </SocketContext.Provider>
  );
};