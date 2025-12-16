// frontend/src/context/SocketContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import API from '../services/api';
import { subscribeToNotifications, unsubscribeFromNotifications } from '../services/notification';

// Create Context
export const SocketContext = createContext();

// Socket Provider
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userToken, userData } = useContext(AuthContext);

  useEffect(() => {
    if (userToken && userData) {
      console.log('🔄 Initializing socket connection...');
      // derive socket server from API baseURL (removes trailing /api)
      const apiBase = API.defaults.baseURL || 'http://localhost:5000/api';
      const socketServer = apiBase.replace(/\/api\/?$/, '');

      const newSocket = io(socketServer, {
        auth: {
          token: userToken
        }
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to server');
        setSocket(newSocket);

        // Subscribe to notification events and update context state
        subscribeToNotifications(newSocket, (payload) => {
          console.log('🔔 Notification received (context):', payload);
          if (payload && payload.notification) {
            setNotifications(prev => [payload.notification, ...prev]);
          }
          if (payload && typeof payload.unreadCount === 'number') {
            setUnreadCount(payload.unreadCount);
          }

          // Also dispatch a global event for components that don't use context
          try {
            window.dispatchEvent(new CustomEvent('notification_received', { detail: payload }));
          } catch (e) {}
        });
      });

      newSocket.on('user_online', (data) => {
        console.log('👤 User online:', data.userId);
        setOnlineUsers(prev => [...prev, data.userId]);
      });

      newSocket.on('user_offline', (data) => {
        console.log('👤 User offline:', data.userId);
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });

      return () => {
        console.log('🔄 Cleaning up socket connection...');
        unsubscribeFromNotifications(newSocket);
        newSocket.close();
        setSocket(null);
        setNotifications([]);
        setUnreadCount(0);
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [userToken, userData]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, notifications, unreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};