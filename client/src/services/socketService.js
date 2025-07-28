import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000', {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
        this.connected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
        this.connected = false;
      });

      this.socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Join auction chat room
  joinAuctionChat(productId, userId) {
    if (this.socket) {
      const roomId = `auction-chat-${productId}`;
      this.socket.emit('joinRoom', { roomId, userId });
      console.log(`📥 Joining auction chat room: ${roomId}`);
    }
  }

  // Leave auction chat room
  leaveAuctionChat(productId) {
    if (this.socket) {
      const roomId = `auction-chat-${productId}`;
      this.socket.emit('leaveRoom', { roomId });
      console.log(`📤 Leaving auction chat room: ${roomId}`);
    }
  }

  // Send message in auction chat
  sendAuctionMessage(productId, senderId, message) {
    if (this.socket) {
      const roomId = `auction-chat-${productId}`;
      this.socket.emit('sendMessage', {
        roomId,
        senderId,
        text: message
      });
      console.log(`💬 Sending message to room: ${roomId}`);
    }
  }

  // Listen for new messages
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('newChatMessage', callback);
    }
  }

  // Remove message listener
  offNewMessage() {
    if (this.socket) {
      this.socket.off('newChatMessage');
    }
  }

  // Join auction room for bid notifications
  joinAuction(productId, userId) {
    if (this.socket) {
      this.socket.emit('joinAuction', { productId, userId });
      console.log(`🎯 Joining auction room: auction-${productId}`);
    }
  }

  // Leave auction room
  leaveAuction(productId, userId) {
    if (this.socket) {
      this.socket.emit('leaveAuction', { productId, userId });
      console.log(`🚪 Leaving auction room: auction-${productId}`);
    }
  }

  // Listen for bid updates
  onBidUpdate(callback) {
    if (this.socket) {
      this.socket.on('newBid', callback);
      this.socket.on('bidUpdate', callback);
    }
  }

  // Remove bid update listener
  offBidUpdate() {
    if (this.socket) {
      this.socket.off('newBid');
      this.socket.off('bidUpdate');
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;
