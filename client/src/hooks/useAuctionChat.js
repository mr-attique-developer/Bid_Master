import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import chatSocketService from '../services/chatSocketService';
import { 
  useGetAuctionWinnerChatQuery, 
  useSendAuctionWinnerMessageMutation 
} from '../services/chatApi';

export const useAuctionChat = (productId) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);

  // RTK Query hooks
  const { 
    data: chatData, 
    isLoading: isChatLoading, 
    error: chatQueryError,
    refetch: refetchChat 
  } = useGetAuctionWinnerChatQuery(productId, {
    skip: !productId || !isAuthenticated
  });

  const [sendMessage, { 
    isLoading: isSendingMessage, 
    error: sendError 
  }] = useSendAuctionWinnerMessageMutation();

  // Initialize socket connection with better reconnection logic
  useEffect(() => {
    if (isAuthenticated && (user?._id || user?.id)) {
      const userId = user._id || user.id;
      chatSocketService.connect(userId);
      
      // Set up connection retry logic
      const connectionCheckInterval = setInterval(() => {
        if (!chatSocketService.isConnected() && isAuthenticated) {
          chatSocketService.connect(userId);
        }
      }, 5000);

      return () => {
        clearInterval(connectionCheckInterval);
        if (productId) {
          chatSocketService.leaveChatRoom();
        }
      };
    }
  }, [isAuthenticated, user?._id, user?.id, productId]);

  // Setup socket event handlers with better message handling
  useEffect(() => {
    const unsubscribeMessage = chatSocketService.addMessageHandler((data) => {
      if (data.productId === productId) {
        setMessages(prevMessages => {
          // Avoid duplicate messages by checking if message already exists
          const messageExists = prevMessages.some(msg => 
            (msg._id && data.message._id && msg._id === data.message._id) ||
            (msg.timestamp === data.message.timestamp && 
             msg.text === data.message.text && 
             msg.sender._id === data.message.sender._id)
          );
          
          if (!messageExists) {
            return [...prevMessages, data.message];
          } else {
            return prevMessages;
          }
        });
      }
    });

    const unsubscribeConnection = chatSocketService.addConnectionHandler((data) => {
      setIsConnected(data.connected);
      if (!data.connected) {
        setHasJoinedRoom(false);
      }
    });

    const unsubscribeError = chatSocketService.addErrorHandler((error) => {
      console.error('❌ Chat socket error:', error);
      setChatError(error.message || 'Socket connection error');
    });

    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
      unsubscribeError();
    };
  }, [productId]);

  // Join chat room when chat data is loaded and socket is connected
  useEffect(() => {
    if (chatData?.chat && isConnected && (user?._id || user?.id) && !hasJoinedRoom) {
      const userId = user._id || user.id;
      const joined = chatSocketService.joinAuctionChatRoom(productId, userId);
      if (joined) {
        setHasJoinedRoom(true);
      }
    }
  }, [chatData, isConnected, user?._id, user?.id, productId, hasJoinedRoom]);

  // Update messages when chat data loads
  useEffect(() => {
    if (chatData?.chat?.messages) {
      setMessages(chatData.chat.messages);
    }
  }, [chatData]);

  // Send message function
  const handleSendMessage = useCallback(async (text) => {
    if (!text?.trim() || !productId || !isAuthenticated) {
      return { success: false, error: 'Invalid message or not authenticated' };
    }

    const userId = user?._id || user?.id;
    if (!userId) {
      return { success: false, error: 'User ID not available' };
    }

    try {
      // Send via API (this will also trigger real-time via socket in backend)
      const result = await sendMessage({ 
        productId, 
        text: text.trim() 
      }).unwrap();
      
      // Also send via socket for immediate delivery (backup)
      chatSocketService.sendMessage(productId, text.trim(), userId);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      return { 
        success: false, 
        error: error?.data?.message || 'Failed to send message' 
      };
    }
  }, [productId, isAuthenticated, user?._id, user?.id, sendMessage]);

  // Get other participant info
  const getOtherParticipant = useCallback(() => {
    if (!chatData?.chat || !(user?._id || user?.id)) return null;
    
    const { seller, winner } = chatData.chat;
    const currentUserId = (user._id || user.id).toString();
    
    if (seller?._id?.toString() === currentUserId) {
      return { role: 'seller', other: winner };
    } else if (winner?._id?.toString() === currentUserId) {
      return { role: 'winner', other: seller };
    }
    
    return null;
  }, [chatData, user?._id, user?.id]);

  // Check if user has access to this chat
  const hasAccess = useCallback(() => {
    if (!chatData?.chat || !(user?._id || user?.id)) {
      return false;
    }
    
    const { seller, winner } = chatData.chat;
    const currentUserId = (user._id || user.id).toString();
    
    return seller?._id?.toString() === currentUserId || 
           winner?._id?.toString() === currentUserId;
  }, [chatData, user?._id, user?.id]);

  return {
    // Chat data
    chat: chatData?.chat,
    product: chatData?.product,
    messages,
    
    // Participant info
    otherParticipant: getOtherParticipant(),
    hasAccess: hasAccess(),
    
    // Connection status
    isConnected,
    hasJoinedRoom,
    
    // Loading states
    isChatLoading,
    isSendingMessage,
    
    // Errors
    error: chatError || chatQueryError || sendError,
    
    // Actions
    sendMessage: handleSendMessage,
    refetchChat,
    
    // Socket utilities
    joinRoom: () => chatSocketService.joinAuctionChatRoom(productId, user?._id || user?.id),
    leaveRoom: () => chatSocketService.leaveChatRoom(),
  };
};
