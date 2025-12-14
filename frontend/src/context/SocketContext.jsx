// frontend/src/context/SocketContext.jsx

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

  useEffect(() => {
    if (userToken && userData) {
      console.log('🔄 Initializing socket connection...');
      
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: userToken
        }
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to server');
        setSocket(newSocket);
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
        newSocket.close();
        setSocket(null);
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [userToken, userData]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};