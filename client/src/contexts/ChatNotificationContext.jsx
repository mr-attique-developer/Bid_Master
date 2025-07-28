import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import chatSocketService from '../services/chatSocketService';

const ChatNotificationContext = createContext();

export const useChatNotification = () => {
  const context = useContext(ChatNotificationContext);
  if (!context) {
    throw new Error('useChatNotification must be used within a ChatNotificationProvider');
  }
  return context;
};

export const ChatNotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [unreadChats, setUnreadChats] = useState(new Map()); // productId -> count
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && chatSocketService) {
      chatSocketService.connect();
      
      // Listen for new messages
      const unsubscribeMessage = chatSocketService.addMessageHandler((data) => {
        // Only count if it's not from current user and has productId
        if (data.sender && data.sender._id !== user._id && data.productId) {
          setUnreadChats(prev => {
            const newMap = new Map(prev);
            const currentCount = newMap.get(data.productId) || 0;
            newMap.set(data.productId, currentCount + 1);
            return newMap;
          });
        }
      });

      return () => {
        if (unsubscribeMessage) {
          unsubscribeMessage();
        }
        chatSocketService.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  // Update total count when unreadChats changes
  useEffect(() => {
    const total = Array.from(unreadChats.values()).reduce((sum, count) => sum + count, 0);
    setTotalUnreadCount(total);
  }, [unreadChats]);

  // Mark chat as read
  const markChatAsRead = (productId) => {
    setUnreadChats(prev => {
      const newMap = new Map(prev);
      newMap.delete(productId);
      return newMap;
    });
  };

  // Get unread count for specific chat
  const getUnreadCount = (productId) => {
    return unreadChats.get(productId) || 0;
  };

  const value = {
    unreadChats,
    totalUnreadCount,
    markChatAsRead,
    getUnreadCount
  };

  return (
    <ChatNotificationContext.Provider value={value}>
      {children}
    </ChatNotificationContext.Provider>
  );
};
