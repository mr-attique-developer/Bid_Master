import { io } from 'socket.io-client';

class ChatSocketService {
  constructor() {
    this.socket = null;
    this.currentUserId = null;
    this.currentChatRoom = null;
    this.messageHandlers = new Set();
    this.notificationHandlers = new Set();
    this.connectionHandlers = new Set();
    this.errorHandlers = new Set();
  }

  // Initialize socket connection
  connect(userId) {
    if (this.socket?.connected) {
      return;
    }

    this.currentUserId = userId;
    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
    console.log('🔌 Connecting to chat socket...');
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
      this.currentChatRoom = null;
      console.log('🔌 Chat socket disconnected');
    }
  }

  // Setup all socket event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Chat socket connected:', this.socket.id);
      this.notifyConnectionHandlers({ connected: true, socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Chat socket disconnected:', reason);
      this.notifyConnectionHandlers({ connected: false, reason });
    });

    // Chat-specific events
    this.socket.on('newChatMessage', (data) => {
      console.log('📩 New chat message received:', data);
      this.notifyMessageHandlers(data);
    });

    this.socket.on('chatNotification', (data) => {
      console.log('🔔 Chat notification received:', data);
      this.notifyNotificationHandlers(data);
    });

    this.socket.on('joinedRoom', (data) => {
      console.log('✅ Successfully joined chat room:', data);
      this.currentChatRoom = data.roomId;
    });

    this.socket.on('error', (error) => {
      console.error('❌ Chat socket error:', error);
      this.notifyErrorHandlers(error);
    });

    // Auction bidding events (for consistency)
    this.socket.on('newBid', (data) => {
      console.log('📈 New bid received in chat context:', data);
    });
  }

  // Join auction chat room
  joinAuctionChatRoom(productId, userId) {
    if (!this.socket?.connected) {
      console.error('❌ Socket not connected, cannot join room');
      return false;
    }

    const roomId = `auction-chat-${productId}`;
    console.log(`🚪 Joining auction chat room: ${roomId}`);
    
    this.socket.emit('joinRoom', { 
      roomId, 
      userId: userId || this.currentUserId 
    });
    
    return true;
  }

  // Leave current chat room
  leaveChatRoom() {
    if (this.currentChatRoom && this.socket?.connected) {
      console.log(`🚪 Leaving chat room: ${this.currentChatRoom}`);
      this.socket.emit('leaveRoom', { roomId: this.currentChatRoom });
      this.currentChatRoom = null;
    }
  }

  // Send message via socket (for real-time delivery)
  sendMessage(productId, text, senderId) {
    if (!this.socket?.connected) {
      console.error('❌ Socket not connected, cannot send message');
      return false;
    }

    const roomId = `auction-chat-${productId}`;
    console.log(`💬 Sending message to room ${roomId}:`, text);
    
    this.socket.emit('sendMessage', {
      roomId,
      senderId: senderId || this.currentUserId,
      text: text.trim()
    });
    
    return true;
  }

  // Message handlers management
  addMessageHandler(handler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  addNotificationHandler(handler) {
    this.notificationHandlers.add(handler);
    return () => this.notificationHandlers.delete(handler);
  }

  addConnectionHandler(handler) {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  addErrorHandler(handler) {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  // Notify all handlers
  notifyMessageHandlers(data) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('❌ Error in message handler:', error);
      }
    });
  }

  notifyNotificationHandlers(data) {
    this.notificationHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('❌ Error in notification handler:', error);
      }
    });
  }

  notifyConnectionHandlers(data) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('❌ Error in connection handler:', error);
      }
    });
  }

  notifyErrorHandlers(error) {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (error) {
        console.error('❌ Error in error handler:', error);
      }
    });
  }

  // Utility methods
  isConnected() {
    return this.socket?.connected || false;
  }

  getCurrentRoom() {
    return this.currentChatRoom;
  }

  getCurrentUserId() {
    return this.currentUserId;
  }

  getSocketId() {
    return this.socket?.id;
  }
}

// Create singleton instance
const chatSocketService = new ChatSocketService();

export default chatSocketService;
