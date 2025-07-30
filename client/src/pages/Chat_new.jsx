import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { 
  Search, 
  Send, 
  MoreVertical, 
  ChevronLeft, 
  MessageSquare,
  Loader,
  AlertCircle,
  ShoppingBag,
  Bell,
  User,
  ArrowLeft
} from 'lucide-react';
import {
  useGetUserAuctionChatsQuery,
  useGetAuctionWinnerChatQuery,
  useSendAuctionWinnerMessageMutation,
  chatApi
} from '../services/chatApi';
import { useSocket } from '../hooks/useSocket';

// Helper function to get initials from name
const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2) // Take only first 2 initials
    .join('');
};

// WhatsApp-style time formatting
const formatMessageTime = (timestamp) => {
  if (!timestamp) return 'Now';
  
  const messageDate = new Date(timestamp);
  const now = new Date();
  
  if (isToday(messageDate)) {
    // Today: show time only in 12-hour format (e.g., "2:30 PM")
    return format(messageDate, 'h:mm a');
  } else if (isYesterday(messageDate)) {
    // Yesterday: show "Yesterday" with time (e.g., "Yesterday 2:30 PM")
    return `Yesterday ${format(messageDate, 'h:mm a')}`;
  } else if (now.getTime() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
    // Within last week: show day name with time (e.g., "Monday 2:30 PM")
    return `${format(messageDate, 'EEEE')} ${format(messageDate, 'h:mm a')}`;
  } else {
    // Older: show date with time (e.g., "12/01/2024 2:30 PM")
    return `${format(messageDate, 'dd/MM/yyyy')} ${format(messageDate, 'h:mm a')}`;
  }
};

const Chat = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  // New UI state management
  const [showChatList, setShowChatList] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastSeenMessages, setLastSeenMessages] = useState({});
  
  // Notification state
  const [newMessageNotification, setNewMessageNotification] = useState(null);
  
  // Force update state for real-time updates
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Local messages state for immediate updates
  const [localMessages, setLocalMessages] = useState([]);
  
  // Scroll state
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null); // Add ref for input field
  const typingTimeoutRef = useRef(null);
  const refetchTimeoutRef = useRef(null);
  const notificationTimeoutRef = useRef(null);
  const shouldAcceptApiUpdatesRef = useRef(true); // Track when to accept API updates

  // Get current user from Redux store
  const { user } = useSelector((state) => state.auth);

  // Socket hook with error handling
  const socketResult = useSocket();
  const { socket, isConnected, joinRoom, leaveRoom, sendMessage: sendSocketMessage, emitTyping } = socketResult || {};

  // API hooks
  const { 
    data: auctionChatsData, 
    isLoading: isLoadingAuctionChats, 
    error: auctionChatsError,
    refetch: refetchAuctionChats
  } = useGetUserAuctionChatsQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  const { 
    data: currentChatData, 
    isLoading: isLoadingCurrentChat, 
    error: currentChatError,
    refetch: refetchCurrentChat
  } = useGetAuctionWinnerChatQuery(selectedChatId, {
    skip: !selectedChatId,
    refetchOnMountOrArgChange: true
  });

  const [sendMessageMutation, { isLoading: isSendingMessage }] = useSendAuctionWinnerMessageMutation();

  // Update local messages when API data changes
  useEffect(() => {
    console.log('📥 API Data Effect Triggered');
    console.log('📥 currentChatData:', currentChatData);
    
    let apiMessages = null;
    
    // Check different possible locations for messages
    if (currentChatData?.chat?.messages) {
      apiMessages = currentChatData.chat.messages;
      console.log('📥 Found messages in currentChatData.chat.messages:', apiMessages.length);
    } else if (currentChatData?.messages) {
      apiMessages = currentChatData.messages;
      console.log('📥 Found messages in currentChatData.messages:', apiMessages.length);
    }
    
    if (apiMessages) {
      console.log('📥 Current localMessages:', localMessages?.length || 0, 'messages');
      console.log('📥 shouldAcceptApiUpdatesRef:', shouldAcceptApiUpdatesRef.current);
      
      // Always accept API updates if localMessages is empty (initial load) or if explicitly allowed
      if (shouldAcceptApiUpdatesRef.current || !localMessages || localMessages.length === 0) {
        console.log('📥 ✅ Accepting API data and updating localMessages');
        setLocalMessages(apiMessages);
      } else {
        console.log('📥 ⏸️ Blocking API updates (optimistic update in progress)');
      }
    } else {
      console.log('📥 ❌ No messages found in API response');
    }
  }, [currentChatData]);

  // Clear local messages when selected chat changes
  useEffect(() => {
    console.log('🔄 Selected chat changed to:', selectedChatId);
    console.log('🔄 Clearing local messages and enabling API updates');
    setLocalMessages([]);
    shouldAcceptApiUpdatesRef.current = true; // Allow API updates for new chat
  }, [selectedChatId]);

  // WhatsApp-style notification function - Define early to avoid hoisting issues
  const showMessageNotification = useCallback((messageData) => {
    // Don't show notification if chat is already open and visible
    if (selectedChatId === messageData.productId && !showChatList) {
      return;
    }

    // Request browser notification permission and show browser notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`New message from ${messageData.senderName}`, {
          body: messageData.text || messageData.message || 'New message',
          icon: '/favicon.ico',
          tag: messageData.productId
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(`New message from ${messageData.senderName}`, {
              body: messageData.text || messageData.message || 'New message',
              icon: '/favicon.ico',
              tag: messageData.productId
            });
          }
        });
      }
    }

    // Play notification sound (optional)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyu2keBRKF0fPNeSsFJXfH8N2QQAoUXrTp66hVFApGn+Dyu2keBR');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio can't play
    } catch (error) {
      // Ignore audio errors
    }

    // Clear previous notification
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    // Set new notification immediately
    setNewMessageNotification({
      senderName: messageData.senderName || 'Someone',
      message: messageData.text || messageData.message || 'New message',
      productTitle: messageData.productTitle || 'New Message',
      timestamp: Date.now()
    });

    // Clear notification after 4 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setNewMessageNotification(null);
    }, 4000);
  }, [selectedChatId, showChatList]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !user) {
      console.log('⚠️ Socket or user not available:', { socket: !!socket, user: !!user });
      return;
    }

    console.log('🔌 Setting up socket event listeners for user:', user._id);

    const handleReceiveMessage = (data) => {
      console.log('📨 Received message via socket:', data);
      
      // Don't show notification if the message is from the current user (sender)
      const isFromCurrentUser = data.sender?._id === user?._id || data.senderId === user?._id;
      console.log('👤 Is from current user:', isFromCurrentUser);
      console.log('👤 data.sender?._id:', data.sender?._id, 'user._id:', user?._id);
      console.log('👤 data.senderId:', data.senderId, 'user._id:', user?._id);
      
      // Force immediate cache invalidation for real-time updates
      console.log('🔄 Force refetching chat data...');
      
      // Add message to local state immediately for instant UI update
      if (data.productId === selectedChatId) {
        console.log('🚀 Adding socket message to local state for immediate display');
        shouldAcceptApiUpdatesRef.current = false; // Block API updates temporarily
        setLocalMessages(prevMessages => {
          // Check if message already exists to avoid duplicates
          const messageExists = prevMessages.some(msg => 
            msg._id === data._id || 
            (msg.text === data.text && msg.createdAt === data.createdAt)
          );
          
          if (!messageExists) {
            console.log('✅ Socket message added to local state');
            // Allow API updates after adding socket message
            setTimeout(() => {
              shouldAcceptApiUpdatesRef.current = true;
            }, 500);
            return [...prevMessages, data];
          } else {
            console.log('⚠️ Socket message already exists in local state');
            shouldAcceptApiUpdatesRef.current = true; // Re-allow since no change
            return prevMessages;
          }
        });
      }
      
      // Manual cache invalidation using dispatch
      dispatch(chatApi.util.invalidateTags(['Chat']));
      dispatch(chatApi.util.invalidateTags([{ type: 'Chat', id: `auction-${data.productId}` }]));
      
      // Only refetch if we have a selected chat (query is active)
      if (selectedChatId) {
        refetchCurrentChat();
      }
      refetchAuctionChats();
      
      // Force component re-render
      setForceUpdate(prev => prev + 1);
      
      // Update unread count if message is not from current user
      if (!isFromCurrentUser) {
        const messageProductId = data.productId || data.message?.productId;
        console.log('📍 Message product ID:', messageProductId);
        console.log('📍 Current selected chat ID:', selectedChatId);
        console.log('📍 Show chat list:', showChatList);
        
        // Only increment unread count if user is not currently viewing this chat
        if (messageProductId !== selectedChatId || showChatList) {
          console.log('📊 Incrementing unread count for product:', messageProductId);
          setUnreadCounts(prev => {
            const newCounts = {
              ...prev,
              [messageProductId]: (prev[messageProductId] || 0) + 1
            };
            console.log('📊 New unread counts:', newCounts);
            return newCounts;
          });
          
          // Show WhatsApp-style notification for new messages
          console.log('🔔 Showing message notification...');
          try {
            showMessageNotification({
              senderName: data.sender?.fullName || data.senderName || 'Someone',
              text: data.message?.text || data.text || 'New message',
              productTitle: data.productTitle || 'New Message',
              productId: messageProductId
            });
            console.log('✅ Message notification shown successfully');
          } catch (error) {
            console.error('❌ Error showing notification:', error);
          }
        } else {
          console.log('📖 Not incrementing unread count - user is viewing this chat');
        }
      } else {
        console.log('📖 Not processing notification - message is from current user');
      }
    };
    const handleChatNotification = (data) => {
      console.log('🔔 Received chat notification via socket:', data);
      
      // Only show notification if it's for current user (they are the receiver) and not the sender
      if (data.userId === user?._id && data.senderId !== user?._id) {
        console.log('🔔 Processing chat notification for current user');
        console.log('🔔 Current selectedChatId:', selectedChatId);
        console.log('🔔 showChatList:', showChatList);
        
        // Force immediate cache invalidation for real-time updates
        console.log('🎯 Force updating component state...');
        setForceUpdate(prev => prev + 1);
        
        console.log('🔄 Invalidating and refetching data...');
        
        // Manual cache invalidation using dispatch
        dispatch(chatApi.util.invalidateTags(['Chat']));
        dispatch(chatApi.util.invalidateTags([{ type: 'Chat', id: `auction-${data.productId}` }]));
        
        // Only refetch if we have a selected chat (query is active)
        if (selectedChatId) {
          refetchCurrentChat();
        }
        refetchAuctionChats();
        
        // Update unread count
        const messageProductId = data.productId;
        console.log('📍 Message product ID:', messageProductId);
        console.log('📍 Should increment unread count:', messageProductId !== selectedChatId || showChatList);
        
        if (messageProductId !== selectedChatId || showChatList) {
          console.log('📊 Incrementing unread count for notification:', messageProductId);
          setUnreadCounts(prev => {
            const newCounts = {
              ...prev,
              [messageProductId]: (prev[messageProductId] || 0) + 1
            };
            console.log('📊 New unread counts from notification:', newCounts);
            return newCounts;
          });
        }
        
        // Show notification
        console.log('🔔 Showing notification...');
        try {
          showMessageNotification({
            senderName: data.senderName || 'Someone',
            text: data.messagePreview || 'New message',
            productTitle: data.productTitle || 'New Message',
            productId: data.productId
          });
          console.log('✅ Notification shown successfully');
        } catch (error) {
          console.error('❌ Error showing notification:', error);
        }
      } else {
        console.log('🚫 Ignoring notification - not for current user or from current user');
        console.log('🚫 data.userId:', data.userId, 'user._id:', user?._id);
        console.log('🚫 data.senderId:', data.senderId, 'user._id:', user?._id);
      }
    };

    const handleJoinedRoom = (data) => {
      // Room joined successfully
    };

    const handleMessageSent = (data) => {
      // Message sent successfully
    };

    const handleUserTyping = ({ userId, isTyping }) => {
      if (userId !== user?._id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      }
    };

    const handleError = (error) => {
      console.error('❌ Socket error:', error);
    };

    // Log socket connection status
    console.log('🔌 Socket connected:', socket.connected);
    console.log('🔌 Socket ID:', socket.id);

    // Attach event listeners
    socket.on('newChatMessage', handleReceiveMessage);
    socket.on('chatNotification', handleChatNotification);
    socket.on('joinedRoom', handleJoinedRoom);
    socket.on('messageSent', handleMessageSent);
    socket.on('userTyping', handleUserTyping);
    socket.on('error', handleError);

    // Join user's personal notification room
    socket.emit('joinUserRoom', { userId: user._id });

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket event listeners');
      socket.off('newChatMessage', handleReceiveMessage);
      socket.off('chatNotification', handleChatNotification);
      socket.off('joinedRoom', handleJoinedRoom);
      socket.off('messageSent', handleMessageSent);
      socket.off('userTyping', handleUserTyping);
      socket.off('error', handleError);
    };
  }, [socket, user, selectedChatId, showChatList, refetchCurrentChat, refetchAuctionChats, showMessageNotification]);

  // Chat navigation functions - Define before useEffect hooks that use them
  const handleChatSelect = useCallback((chatProductId) => {
    console.log('💬 Selecting chat:', chatProductId);
    
    setSelectedChatId(chatProductId);
    setActiveChat(chatProductId);
    setShowChatList(false);
    
    // Mark as read - reset unread count to 0
    console.log('📖 Marking chat as read:', chatProductId);
    setUnreadCounts(prev => ({
      ...prev,
      [chatProductId]: 0
    }));
    
    // Store last seen message timestamp
    setLastSeenMessages(prev => ({
      ...prev,
      [chatProductId]: Date.now()
    }));
    
    // Force refetch to get latest messages
    setTimeout(() => {
      if (chatProductId && selectedChatId === chatProductId) {
        refetchCurrentChat();
      }
    }, 200); // Increase delay to ensure selectedChatId is updated
  }, [refetchCurrentChat]);

  const handleBackToChatList = useCallback(() => {
    setShowChatList(true);
    setSelectedChatId(null);
    setActiveChat(null);
    if (selectedChatId) {
      leaveRoom(`auction-chat-${selectedChatId}`);
    }
  }, [selectedChatId, leaveRoom]);

  // Scroll functions
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  const handleScroll = useCallback((e) => {
    const container = e.target;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollToBottom(!isNearBottom);
  }, []);

  // Auto-highlight chat if productId is provided in URL, but don't auto-select
  useEffect(() => {
    if (productId) {
      // Just ensure we're showing the chat list, don't auto-select the chat
      setShowChatList(true);
      setSelectedChatId(null);
      // You can add highlighting logic here if needed
    }
  }, [productId]);

  // Auto-focus input when chat is selected
  useEffect(() => {
    if (selectedChatId && !showChatList && messageInputRef.current) {
      // Small delay to ensure the input is rendered
      const focusTimer = setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(focusTimer);
    }
  }, [selectedChatId, showChatList]);

  // Join/leave socket rooms
  useEffect(() => {
    if (selectedChatId && isConnected) {
      console.log('🏠 Joining chat room:', `auction-chat-${selectedChatId}`);
      const roomId = `auction-chat-${selectedChatId}`;
      joinRoom(roomId);

      return () => {
        console.log('🚪 Leaving chat room:', roomId);
        leaveRoom(roomId);
      };
    }
  }, [selectedChatId, isConnected, joinRoom, leaveRoom]);

  // Mark messages as read when viewing a chat
  useEffect(() => {
    if (selectedChatId && !showChatList) {
      console.log('📖 Marking messages as read for chat:', selectedChatId);
      // Reset unread count when actively viewing a chat
      setUnreadCounts(prev => ({
        ...prev,
        [selectedChatId]: 0
      }));
    }
  }, [selectedChatId, showChatList, currentChatData?.chat?.messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      // Use setTimeout to ensure scroll happens after DOM update
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [currentChatData?.chat?.messages]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    // Clear input immediately for better UX - do this before any checks
    const messageText = message.trim();
    setMessage('');
    
    if (!messageText || !selectedChatId || !user || isSendingMessage) {
      return;
    }

    console.log('📤 Sending message:', messageText);

    // Optimistic update: add message to local state immediately
    const optimisticMessage = {
      _id: `temp-${Date.now()}`, // Temporary ID
      text: messageText,
      sender: { 
        _id: user._id, 
        name: user.name, 
        fullName: user.fullName || user.name,
        profilePicture: user.profilePicture 
      },
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      productId: selectedChatId
    };

    console.log('🚀 Adding optimistic message to local state');
    shouldAcceptApiUpdatesRef.current = false; // Block API updates temporarily
    setLocalMessages(prevMessages => [...prevMessages, optimisticMessage]);

    try {
      // Send via API - server will handle socket emission
      const result = await sendMessageMutation({
        productId: selectedChatId,
        text: messageText
      }).unwrap();
      
      console.log('✅ Message sent successfully:', result);
      
      // Replace optimistic message with real message from server
      if (result.message) {
        console.log('🔄 Replacing optimistic message with server response');
        setLocalMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === optimisticMessage._id ? result.message : msg
          )
        );
      }
      
      // Allow API updates after successful send
      setTimeout(() => {
        shouldAcceptApiUpdatesRef.current = true;
      }, 1000); // Give some time for server to process
      
      // Force immediate refetch for real-time display
      if (selectedChatId) {
        refetchCurrentChat();
      }
      refetchAuctionChats();
      
      // Additional refetch after a short delay to ensure consistency
      setTimeout(() => {
        if (selectedChatId) {
          refetchCurrentChat();
        }
        refetchAuctionChats();
      }, 500);
      
      // Focus back to input for better UX
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Remove optimistic message on error
      setLocalMessages(prevMessages => 
        prevMessages.filter(msg => msg._id !== optimisticMessage._id)
      );
      // Re-allow API updates on error
      shouldAcceptApiUpdatesRef.current = true;
      // Restore message on error so user can retry
      setMessage(messageText);
    }
  }, [message, selectedChatId, user, isSendingMessage, sendMessageMutation, refetchCurrentChat, refetchAuctionChats]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (isConnected && selectedChatId && user) {
      emitTyping(`auction-chat-${selectedChatId}`, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(`auction-chat-${selectedChatId}`, false);
      }, 2000);
    }
  }, [isConnected, selectedChatId, user, emitTyping]);

  // Get processed chat list
  const getChatList = useCallback(() => {
    if (!auctionChatsData?.chats) return [];

    return auctionChatsData.chats
      .filter(chat => {
        if (!searchTerm) return true;
        const productTitle = chat.product?.title?.toLowerCase() || '';
        const sellerName = chat.seller?.fullName?.toLowerCase() || '';
        const winnerName = chat.winner?.fullName?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        
        return productTitle.includes(search) || 
               sellerName.includes(search) || 
               winnerName.includes(search);
      })
      .map(chat => {
        const isUserSeller = chat.seller?._id === user?._id;
        const otherParticipant = isUserSeller ? chat.winner : chat.seller;
        const lastMessage = chat.messages?.length > 0 
          ? chat.messages[chat.messages.length - 1] 
          : null;

        const productId = chat.product._id;
        const currentUnreadCount = unreadCounts[productId] || 0;

        return {
          id: productId,
          name: otherParticipant?.fullName || 'Unknown User',
          email: otherParticipant?.email,
          productTitle: chat.product?.title || 'Unknown Product',
          winningBid: chat.product?.winningBid,
          lastMessage: lastMessage?.text || 'No messages yet',
          time: lastMessage && lastMessage.timestamp ? formatMessageTime(lastMessage.timestamp) : '',
          unread: currentUnreadCount,
          avatar: null,
          online: false, // TODO: Implement online status
          isUserSeller,
          otherParticipant,
          product: chat.product,
          chatId: chat._id,
          hasNewMessage: currentUnreadCount > 0
        };
      })
      .sort((a, b) => {
        // Sort by unread messages first, then by last message time
        if (a.hasNewMessage && !b.hasNewMessage) return -1;
        if (!a.hasNewMessage && b.hasNewMessage) return 1;
        
        // Then sort by last message time (most recent first)
        const aTime = a.time ? new Date(a.time) : new Date(0);
        const bTime = b.time ? new Date(b.time) : new Date(0);
        return bTime - aTime;
      });
  }, [auctionChatsData?.chats, searchTerm, user, unreadCounts]);

  const chatList = getChatList();

  // Main render - using the new enhanced UI
  return (
    <div className="bg-gray-50 w-full" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* WhatsApp-style notification */}
      {newMessageNotification && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm animate-slide-in-right">
          <div className="flex items-start space-x-3">
            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {newMessageNotification.senderName}
                </p>
                <button
                  onClick={() => setNewMessageNotification(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-blue-600 truncate mb-1">
                {newMessageNotification.productTitle}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {newMessageNotification.message}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Just now
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto max-w-6xl h-full flex flex-col relative">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg border-b border-gray-200 px-4 py-4 relative z-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!showChatList && (
                <button
                  onClick={handleBackToChatList}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
              )}
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {!showChatList && selectedChatId && currentChatData?.chat ? (
                  (() => {
                    const chat = currentChatData.chat;
                    const otherUser = user?._id === chat.seller?._id ? chat.winner : chat.seller;
                    return otherUser?.profilePicture ? (
                      <img 
                        src={otherUser.profilePicture} 
                        alt={otherUser.fullName} 
                        className="h-10 w-10 rounded-full object-cover" 
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(otherUser?.fullName)}
                      </div>
                    );
                  })()
                ) : (
                  <MessageSquare className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {showChatList ? 'Auction Chat' : (
                    selectedChatId && currentChatData?.chat ? (
                      (() => {
                        const chat = currentChatData.chat;
                        const otherUser = user?._id === chat.seller?._id ? chat.winner : chat.seller;
                        return otherUser?.fullName || 'Unknown User';
                      })()
                    ) : 'Chat Messages'
                  )}
                </h1>
                <p className="text-blue-100 text-sm">
                  {showChatList 
                    ? (() => {
                        try {
                          const totalUnread = Object.values(unreadCounts || {}).reduce((sum, count) => sum + (count || 0), 0);
                          return `${chatList.length} conversation${chatList.length !== 1 ? 's' : ''}${totalUnread > 0 ? ` • ${totalUnread} unread` : ''}`;
                        } catch (error) {
                          console.error('Error calculating total unread:', error);
                          return `${chatList.length} conversation${chatList.length !== 1 ? 's' : ''}`;
                        }
                      })()
                    : (selectedChatId && currentChatData?.chat ? (
                        (() => {
                          const currentUnread = unreadCounts[selectedChatId] || 0;
                          const productTitle = currentChatData?.chat?.product?.title || 'Product Chat';
                          return `${productTitle}${currentUnread > 0 ? ` • ${currentUnread} unread` : ''}`;
                        })()
                      ) : 'Message conversation')
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Typing Indicator */}
              {!showChatList && typingUsers && typingUsers.size > 0 && (
                <div className="text-sm text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  typing...
                </div>
              )}
              
              {/* Unread Messages Indicator */}
              {(() => {
                try {
                  const totalUnread = Object.values(unreadCounts || {}).reduce((sum, count) => sum + (count || 0), 0);
                  return totalUnread > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-white bg-red-500/80 px-3 py-1 rounded-full backdrop-blur-sm animate-pulse">
                      <Bell className="h-4 w-4" />
                      <span>{totalUnread} unread</span>
                    </div>
                  );
                } catch (error) {
                  console.error('Error calculating unread count:', error);
                  return null;
                }
              })()}
              
              <div className="flex items-center space-x-2 text-sm text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {showChatList ? (
            // Chat List View
            <div className="w-full flex flex-col">
              {/* Search Bar */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto bg-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400" style={{ scrollBehavior: 'smooth' }}>
                {isLoadingAuctionChats ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="h-8 w-8 text-blue-500 animate-spin" />
                    <span className="ml-2 text-gray-600">Loading chats...</span>
                  </div>
                ) : auctionChatsError ? (
                  <div className="flex items-center justify-center py-12 text-red-600">
                    <AlertCircle className="h-6 w-6 mr-2" />
                    <div>
                      <span>Error loading chats</span>
                      <button 
                        onClick={() => refetchAuctionChats()}
                        className="block text-sm text-blue-600 hover:text-blue-800 mt-1"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                ) : chatList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <MessageSquare className="h-12 w-12 mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No conversations yet</p>
                    <p className="text-sm text-center">Start bidding on auctions to begin chatting with sellers!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {chatList.map((chat) => (
                      <ChatListItem 
                        key={chat.id}
                        chat={chat}
                        unreadCount={unreadCounts[chat.id] || 0}
                        onClick={() => handleChatSelect(chat.id)}
                        currentUser={user}
                        isHighlighted={productId === chat.id}
                        hasNewMessage={unreadCounts[chat.id] > 0}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Individual Chat View
            <div className="w-full flex flex-col">
              {selectedChatId ? (
                <ChatView 
                  productId={selectedChatId}
                  currentUser={user}
                  currentChatData={currentChatData}
                  isLoadingCurrentChat={isLoadingCurrentChat}
                  currentChatError={currentChatError}
                  message={message}
                  setMessage={setMessage}
                  handleSendMessage={handleSendMessage}
                  isSendingMessage={isSendingMessage}
                  typingUsers={typingUsers}
                  handleTyping={handleTyping}
                  messagesEndRef={messagesEndRef}
                  messagesContainerRef={messagesContainerRef}
                  messageInputRef={messageInputRef}
                  showScrollToBottom={showScrollToBottom}
                  scrollToBottom={scrollToBottom}
                  handleScroll={handleScroll}
                  localMessages={localMessages}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Chat List Item Component
const ChatListItem = ({ chat, unreadCount, onClick, currentUser, isHighlighted, hasNewMessage }) => {
  // Add null checks to prevent errors
  if (!chat || !currentUser) {
    return null;
  }

  // The chat object now comes from getChatList() which has processed structure
  return (
    <div 
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all duration-200 border-l-4 relative ${
        isHighlighted 
          ? 'bg-blue-50 border-blue-500 shadow-sm' 
          : hasNewMessage
            ? 'bg-green-50 border-green-500 hover:bg-green-100'
            : 'border-transparent hover:bg-gray-50 hover:border-blue-500'
      }`}
    >
      {/* New message notification pulse */}
      {hasNewMessage && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center space-x-1">
            <Bell className="h-4 w-4 text-green-600 animate-pulse" />
            <span className="text-xs text-green-600 font-medium">New</span>
          </div>
        </div>
      )}
      
      <div className="flex items-center space-x-3">
        <div className="relative flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {chat.avatar ? (
              <img 
                src={chat.avatar} 
                alt={chat.name} 
                className="h-12 w-12 rounded-full object-cover" 
              />
            ) : (
              getInitials(chat.name)
            )}
          </div>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
          {/* Online status indicator */}
          <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
            chat.online ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-medium truncate ${
              hasNewMessage ? 'text-green-900' : 'text-gray-900'
            }`}>
              {chat.name || 'Unknown User'}
            </h3>
            {chat.time && (
              <span className={`text-xs flex-shrink-0 ml-2 ${
                hasNewMessage ? 'text-green-600 font-medium' : 'text-gray-500'
              }`}>
                {chat.time}
              </span>
            )}
          </div>
          
          <div className="flex items-center mb-1">
            <ShoppingBag className="h-3 w-3 text-blue-500 mr-1" />
            <p className="text-sm text-blue-600 font-medium truncate">
              {chat.productTitle}
            </p>
          </div>
          
          <p className={`text-sm truncate ${
            hasNewMessage ? 'text-green-700 font-medium' : 'text-gray-600'
          }`}>
            {chat.lastMessage}
          </p>
          
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              {chat.isUserSeller ? '🏪 You are the seller' : '🏆 You won this auction'}
            </p>
            {isHighlighted && (
              <span className="text-xs text-blue-600 font-medium">Click to view messages</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual Chat View Component
const ChatView = ({ 
  productId, 
  currentUser, 
  currentChatData, 
  isLoadingCurrentChat, 
  currentChatError,
  message,
  setMessage,
  handleSendMessage,
  isSendingMessage,
  typingUsers,
  handleTyping,
  messagesEndRef,
  messagesContainerRef,
  messageInputRef,
  showScrollToBottom,
  scrollToBottom,
  handleScroll,
  localMessages
}) => {
  const chat = currentChatData?.chat;
  // Robust message selection: try multiple sources
  let messages = [];
  
  if (localMessages && localMessages.length > 0) {
    messages = localMessages;
    console.log('🎬 Using localMessages:', messages.length, 'messages');
  } else if (chat?.messages && chat.messages.length > 0) {
    messages = chat.messages;
    console.log('🎬 Using chat.messages:', messages.length, 'messages');
  } else if (currentChatData?.messages && currentChatData.messages.length > 0) {
    messages = currentChatData.messages;
    console.log('🎬 Using currentChatData.messages:', messages.length, 'messages');
  } else {
    messages = [];
    console.log('🎬 No messages found anywhere');
  }
  
  console.log('🎬 Final messages to display:', messages.length);
  console.log('🎬 Chat data structure - localMessages:', localMessages?.length || 0);
  console.log('🎬 Chat data structure - chatMessages:', chat?.messages?.length || 0);
  console.log('🎬 Chat data structure - currentChatDataMessages:', currentChatData?.messages?.length || 0);
  console.log('🎬 Chat data structure - hasChat:', !!chat);
  console.log('🎬 Chat data structure - hasCurrentChatData:', !!currentChatData);
  
  const otherUser = currentUser?._id === chat?.seller?._id ? chat?.winner : chat?.seller;

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (messagesContainerRef.current) {
      // Use setTimeout to ensure scroll happens after DOM update
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages.length, messagesContainerRef]);

  if (isLoadingCurrentChat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading chat...</span>
      </div>
    );
  }

  if (currentChatError) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-600">
        <AlertCircle className="h-6 w-6 mr-2" />
        <span>Error loading chat</span>
      </div>
    );
  }

  try {
    return (
      <div className="flex-1 flex flex-col h-full relative">
        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-scroll p-4 bg-gray-50 messages-scrollbar relative" 
          style={{ 
            scrollBehavior: 'smooth'
          }}
          onScroll={handleScroll}
        >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
            <p className="font-medium">No messages yet</p>
            <p className="text-sm text-center mt-2">
              Start the conversation about your auction!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              // Ensure msg has required properties and handle potential undefined values
              if (!msg || !msg.sender) {
                console.warn('🚨 Invalid message object:', msg);
                return null;
              }
              
              const isMe = msg.sender._id === currentUser?._id;
              const showAvatar = index === 0 || messages[index - 1]?.sender?._id !== msg.sender._id;
              const showSenderName = !isMe && showAvatar;
              
              return (
                <div key={msg._id || `msg-${index}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col max-w-xs md:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Sender name */}
                    {showSenderName && (
                      <div className="flex items-center space-x-2 mb-1 px-2">
                        {/* <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {getInitials(msg.sender.fullName)}
                        </div> */}
                        <span className="text-xs font-medium text-gray-600">
                          {msg.sender?.fullName || msg.sender?.name || 'Unknown User'}
                        </span>
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div className={`flex items-end space-x-2 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {!isMe && showAvatar && (
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {msg.sender?.profilePicture ? (
                            <img 
                              src={msg.sender.profilePicture} 
                              alt={msg.sender?.fullName || msg.sender?.name || 'User'} 
                              className="h-7 w-7 rounded-full object-cover" 
                            />
                          ) : (
                            getInitials(msg.sender?.fullName || msg.sender?.name || 'Unknown User')
                          )}
                        </div>
                      )}
                      {!isMe && !showAvatar && (
                        <div className="h-7 w-7 flex-shrink-0"></div>
                      )}
                      <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                        isMe 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}>
                        <p className="text-sm">{msg.text || ''}</p>
                        <p className={`text-xs mt-1 ${
                          isMe ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          {formatMessageTime(msg.timestamp || msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 z-10"
            title="Scroll to bottom"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" transform="rotate(180 10 10)" />
            </svg>
          </button>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            ref={messageInputRef}
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            disabled={isSendingMessage}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
          <button 
            type="submit" 
            disabled={isSendingMessage || !message.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-full transition-colors"
          >
            {isSendingMessage ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
  } catch (error) {
    console.error('🚨 ChatView render error:', error);
    return (
      <div className="flex-1 flex items-center justify-center text-red-600">
        <AlertCircle className="h-6 w-6 mr-2" />
        <span>Error rendering chat</span>
      </div>
    );
  }
};

export default Chat;