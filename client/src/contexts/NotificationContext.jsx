import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import chatSocketService from '../services/chatSocketService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token || !user) return;

    // Connect to socket
    chatSocketService.connect(user._id);

    // Listen for general notifications
    const removeGeneralNotificationHandler = chatSocketService.addGeneralNotificationHandler((notification) => {
      console.log('🔔 Real-time notification received:', notification);
      
      // Only show notification if it's for current user (or not excluded)
      if (notification.userId === user._id || (!notification.userId && notification.excludeUserId !== user._id)) {
        // Add to local notification state
        setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep latest 20
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico', // Add your app icon
            tag: notification.type // Prevent duplicate notifications
          });
        }
        
        // Show toast notification (you can customize this)
        showToastNotification(notification);
      }
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      removeGeneralNotificationHandler();
    };
  }, [token, user]);

  const showToastNotification = (notification) => {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm transform transition-all duration-300 translate-x-full';
    toast.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="text-2xl">${getNotificationEmoji(notification.type)}</div>
        <div class="flex-1">
          <h4 class="text-sm font-medium text-gray-900">${notification.title}</h4>
          <p class="text-xs text-gray-600 mt-1">${notification.message}</p>
        </div>
        <button class="text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }, 5000);
  };

  const getNotificationEmoji = (type) => {
    switch (type) {
      case 'NEW_BID':
        return '💰';
      case 'OUTBID':
        return '⚠️';
      case 'WINNER_ANNOUNCED':
        return '🎉';
      case 'NEW_MESSAGE':
        return '💬';
      case 'NEW_PRODUCT':
        return '🆕';
      default:
        return '🔔';
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
