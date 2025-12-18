// frontend/src/services/chat.js

import API from "./api";

// Chat APIs
export const getChats = () => API.get("/chats");
export const startChat = (receiverId) => API.post("/chats/start", { receiverId });
export const getMessages = (chatId, page = 1) => API.get(`/chats/${chatId}/messages?page=${page}`);
export const sendMessage = (chatId, messageData) => API.post(`/chats/${chatId}/messages`, messageData);
export const markAsRead = (chatId) => API.put(`/chats/${chatId}/read`);
export const deleteMessage = (messageId, deleteType = 'forMe') => 
  API.delete(`/messages/${messageId}?deleteType=${deleteType}`);
export const reactToMessage = (messageId, emoji) => API.post(`/messages/${messageId}/react`, { emoji });
export const deleteChat = (chatId) => API.delete(`/chats/${chatId}`);

// Socket service
export const initializeSocket = (token) => {
  // We'll implement this in context
};