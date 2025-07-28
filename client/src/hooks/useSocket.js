// hooks/useSocket.js
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && !socketRef.current) {
      console.log('🔄 Initializing socket connection...');
      
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('🟢 Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔴 Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setIsConnected(false);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    }

    return () => {
      if (socketRef.current) {
        console.log('🔌 Cleaning up socket connection...');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [user]);

  const joinRoom = (roomId) => {
    if (socket && user) {
      console.log('🚪 Joining room:', roomId);
      socket.emit('joinRoom', {
        roomId,
        userId: user._id
      });
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && user) {
      console.log('👋 Leaving room:', roomId);
      socket.emit('leaveRoom', {
        roomId,
        userId: user._id
      });
    }
  };

  const sendMessage = (roomId, text) => {
    if (socket && user) {
      console.log('💬 Sending message to room:', roomId);
      socket.emit('sendMessage', {
        roomId,
        senderId: user._id,
        text
      });
    }
  };

  const emitTyping = (roomId, isTyping) => {
    if (socket && user) {
      socket.emit('typing', {
        roomId,
        userId: user._id,
        isTyping
      });
    }
  };

  return {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    emitTyping
  };
};