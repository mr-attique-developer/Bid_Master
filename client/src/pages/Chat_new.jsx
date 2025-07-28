import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
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
  useSendAuctionWinnerMessageMutation
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

const Chat = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
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
  
  // Scroll state
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const refetchTimeoutRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  // Get current user from Redux store
  const { user } = useSelector((state) => state.auth);

  // Socket hook
  const { socket, isConnected, joinRoom, leaveRoom, sendMessage: sendSocketMessage, emitTyping } = useSocket();

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

  // Socket event handlers
  useEffect(() => {
    if (!socket) {
      console.log('❌ No socket connection available');
      return;
    }
    
    if (!user) {
      console.log('❌ No user available for socket events');
      return;
    }

    console.log('🔌 Setting up socket event listeners for user:', user._id);
    console.log('🔌 Socket connected:', isConnected);

    let refetchTimeout;

    const handleReceiveMessage = (data) => {
      console.log('💬 Received new message via socket:', data);
      
      // Update unread count if message is not from current chat or user is viewing chat list
      if (data.productId !== selectedChatId || showChatList) {
        setUnreadCounts(prev => ({
          ...prev,
          [data.productId]: (prev[data.productId] || 0) + 1
        }));
        
        // Show WhatsApp-style notification for new messages
        showMessageNotification({
          senderName: data.sender?.fullName || data.senderName || 'Someone',
          text: data.message?.text || data.text || 'New message',
          productTitle: data.productTitle || 'New Message',
          productId: data.productId
        });
      }
      
      // Debounce refetch to prevent multiple calls
      if (refetchTimeout) clearTimeout(refetchTimeout);
      refetchTimeout = setTimeout(() => {
        console.log('🔄 Refetching chats...');
        refetchCurrentChat();
        refetchAuctionChats();
      }, 200);
    };

    const handleChatNotification = (data) => {
      console.log('🔔 Received chat notification:', data);
      
      // Only show notification if it's for current user (they are the receiver)
      if (data.userId === user?._id) {
        // Update unread count
        setUnreadCounts(prev => ({
          ...prev,
          [data.productId]: (prev[data.productId] || 0) + 1
        }));
        
        // Show notification
        showMessageNotification({
          senderName: data.senderName || 'Someone',
          text: data.messagePreview || 'New message',
          productTitle: data.productTitle || 'New Message',
          productId: data.productId
        });
      }
    };

    const handleJoinedRoom = (data) => {
      console.log('✅ Joined room successfully:', data);
    };

    const handleMessageSent = (data) => {
      console.log('✅ Message sent successfully:', data);
      // No refetch needed here
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

    // Attach event listeners
    socket.on('newChatMessage', handleReceiveMessage);
    socket.on('chatNotification', handleChatNotification);
    socket.on('joinedRoom', handleJoinedRoom);
    socket.on('messageSent', handleMessageSent);
    socket.on('userTyping', handleUserTyping);
    socket.on('error', handleError);

    // Cleanup
    return () => {
      if (refetchTimeout) clearTimeout(refetchTimeout);
      socket.off('newChatMessage', handleReceiveMessage);
      socket.off('chatNotification', handleChatNotification);
      socket.off('joinedRoom', handleJoinedRoom);
      socket.off('messageSent', handleMessageSent);
      socket.off('userTyping', handleUserTyping);
      socket.off('error', handleError);
    };
  }, [socket, user, refetchCurrentChat, refetchAuctionChats]);

  // Chat navigation functions - Define before useEffect hooks that use them
  const handleChatSelect = useCallback((chatProductId) => {
    setSelectedChatId(chatProductId);
    setActiveChat(chatProductId);
    setShowChatList(false);
    
    // Mark as read
    setUnreadCounts(prev => ({
      ...prev,
      [chatProductId]: 0
    }));
    
    // Store last seen message timestamp
    setLastSeenMessages(prev => ({
      ...prev,
      [chatProductId]: Date.now()
    }));
  }, []);

  const handleBackToChatList = useCallback(() => {
    setShowChatList(true);
    setSelectedChatId(null);
    setActiveChat(null);
    if (selectedChatId) {
      leaveRoom(`auction-chat-${selectedChatId}`);
    }
  }, [selectedChatId, leaveRoom]);

  // WhatsApp-style notification function
  const showMessageNotification = useCallback((messageData) => {
    console.log('🔔 Showing notification for:', messageData);
    
    // Don't show notification if chat is already open and visible
    if (selectedChatId === messageData.productId && !showChatList) {
      console.log('🚫 Not showing notification - chat is open');
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

    console.log('✅ Notification set successfully');

    // Clear notification after 4 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setNewMessageNotification(null);
      console.log('🗑️ Notification cleared');
    }, 4000);
  }, [selectedChatId, showChatList]);

  // Scroll functions
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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

  // Join/leave socket rooms
  useEffect(() => {
    if (selectedChatId && isConnected) {
      const roomId = `auction-chat-${selectedChatId}`;
      joinRoom(roomId);

      return () => {
        leaveRoom(roomId);
      };
    }
  }, [selectedChatId, isConnected, joinRoom, leaveRoom]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatData?.chat?.messages]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChatId || !user || isSendingMessage) return;

    const messageText = message.trim();
    setMessage(''); // Clear input immediately for better UX

    try {
      // Only send via API - server will handle socket emission
      console.log('📤 Sending message via API...');
      await sendMessageMutation({
        productId: selectedChatId,
        text: messageText
      }).unwrap();

      console.log('✅ Message sent via API successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Restore message on error
      setMessage(messageText);
    }
  }, [message, selectedChatId, user, isSendingMessage, sendMessageMutation]);

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

        return {
          id: chat.product._id,
          name: otherParticipant?.fullName || 'Unknown User',
          email: otherParticipant?.email,
          productTitle: chat.product?.title || 'Unknown Product',
          winningBid: chat.product?.winningBid,
          lastMessage: lastMessage?.text || 'No messages yet',
          time: lastMessage && lastMessage.timestamp ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true }) : '',
          unread: 0, // TODO: Implement read status
          avatar: null,
          online: false, // TODO: Implement online status
          isUserSeller,
          otherParticipant,
          product: chat.product,
          chatId: chat._id
        };
      })
      .sort((a, b) => {
        // Sort by last message time (most recent first)
        const aTime = a.time ? new Date(a.time) : new Date(0);
        const bTime = b.time ? new Date(b.time) : new Date(0);
        return bTime - aTime;
      });
  }, [auctionChatsData?.chats, searchTerm, user]);

  const chatList = getChatList();

  // Debug logging
  console.log('🐛 Chat Component Debug:', {
    auctionChatsData,
    chatList,
    chatListLength: chatList.length,
    selectedChatId,
    currentChatData,
    isLoadingAuctionChats,
    isLoadingCurrentChat
  });

  // Main render - using the new enhanced UI
  return (
    <div className="bg-gray-50 min-h-screen w-full">
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
      
      <div className="container mx-auto max-w-6xl h-screen flex flex-col">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg border-b border-gray-200 px-4 py-4">
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
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {showChatList ? 'Auction Chat' : 'Chat Messages'}
                </h1>
                <p className="text-blue-100 text-sm">
                  {showChatList 
                    ? `${chatList.length} conversation${chatList.length !== 1 ? 's' : ''}` 
                    : currentChatData?.chat?.product?.title || 'Loading...'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {!showChatList && currentChatData?.chat && (
                <div className="flex items-center space-x-3 text-white">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {currentChatData.chat.seller._id === user?._id ? 'Buyer' : 'Seller'}
                    </p>
                    <p className="text-xs text-blue-100">
                      {currentChatData.chat.seller._id === user?._id 
                        ? currentChatData.chat.winner?.fullName || 'Unknown'
                        : currentChatData.chat.seller?.fullName || 'Unknown'
                      }
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(currentChatData.chat.seller._id === user?._id 
                      ? currentChatData.chat.winner?.fullName || 'U'
                      : currentChatData.chat.seller?.fullName || 'U'
                    )}
                  </div>
                </div>
              )}
              
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
                  showScrollToBottom={showScrollToBottom}
                  scrollToBottom={scrollToBottom}
                  handleScroll={handleScroll}
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
  showScrollToBottom,
  scrollToBottom,
  handleScroll
}) => {
  const chat = currentChatData?.chat;
  const messages = chat?.messages || []; // Get messages from chat object
  const otherUser = currentUser?._id === chat?.seller?._id ? chat?.winner : chat?.seller;

  // Debug logging
  console.log('🐛 ChatView Debug:', {
    currentChatData,
    chat,
    messages,
    messagesLength: messages.length,
    otherUser
  });

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, messagesEndRef]);

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

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {otherUser?.profilePicture ? (
              <img 
                src={otherUser.profilePicture} 
                alt={otherUser.fullName} 
                className="h-10 w-10 rounded-full object-cover" 
              />
            ) : (
              getInitials(otherUser?.fullName)
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center">
              <ShoppingBag className="h-3 w-3 text-blue-500 mr-1" />
              <p className="text-sm text-blue-600 font-medium">
                {chat?.product?.title}
              </p>
            </div>
          </div>
          {typingUsers.size > 0 && (
            <div className="text-sm text-gray-500 italic">
              typing...
            </div>
          )}
        </div>
      </div>

      {/* User Name Section */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
        <h3 className="font-medium text-gray-900 text-center">
          {otherUser?.fullName || 'Unknown User'}
        </h3>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-scroll p-4 bg-gray-50 messages-scrollbar relative" 
        style={{ 
          scrollBehavior: 'smooth',
          minHeight: '400px', // Ensure minimum height for scrollbar to appear
          maxHeight: 'calc(100vh - 300px)' // Ensure it doesn't grow too large
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
              const isMe = msg.sender._id === currentUser?._id;
              const showAvatar = index === 0 || messages[index - 1]?.sender._id !== msg.sender._id;
              const showSenderName = !isMe && showAvatar;
              
              return (
                <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col max-w-xs md:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Sender name */}
                    {showSenderName && (
                      <div className="flex items-center space-x-2 mb-1 px-2">
                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {getInitials(msg.sender.fullName)}
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {msg.sender.fullName || 'Unknown User'}
                        </span>
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div className={`flex items-end space-x-2 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {!isMe && showAvatar && (
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {msg.sender.profilePicture ? (
                            <img 
                              src={msg.sender.profilePicture} 
                              alt={msg.sender.fullName} 
                              className="h-7 w-7 rounded-full object-cover" 
                            />
                          ) : (
                            getInitials(msg.sender.fullName)
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
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${
                          isMe ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : 'Just now'}
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
};

export default Chat;