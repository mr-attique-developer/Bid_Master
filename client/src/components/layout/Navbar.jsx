import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon, MessageSquareIcon, UserIcon, MenuIcon, XIcon } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useLogoutUserMutation } from '../../services/authApi';
import { logout, setCredentials } from '../../features/auth/authSlice';
import { useChatNotification } from '../../contexts/ChatNotificationContext';
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation, notificationApi } from '../../services/notificationApi';
import chatSocketService from '../../services/chatSocketService';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  const [logoutUser] = useLogoutUserMutation();
  const { totalUnreadCount } = useChatNotification();
  const [markAsRead] = useMarkNotificationAsReadMutation();
  
  // Fetch notifications using RTK Query
  const { data: notificationsData, isLoading: notificationsLoading } = useGetNotificationsQuery(
    { page: 1, limit: 10 },
    { skip: !token } // Skip if not authenticated
  );

  const notifications = notificationsData?.notifications || [];
  const unreadNotificationsCount = notificationsData?.unreadCount || 0;

  // Setup real-time notifications
  useEffect(() => {
    if (!token || !user?._id) {
      chatSocketService.disconnect(); // Disconnect if no user
      return;
    }
    
    // Connect to socket for real-time notifications
    chatSocketService.connect(user._id);

    // Wait a bit for connection to establish, then join user room
    const connectionTimer = setTimeout(() => {
      if (chatSocketService.isConnected()) {
        chatSocketService.socket?.emit('joinUserRoom', { userId: user._id });
      }
    }, 1000);

    // Listen for new notifications
    const removeNotificationHandler = chatSocketService.addGeneralNotificationHandler((notification) => {
      // Invalidate RTK Query cache to refetch notifications
      dispatch(notificationApi.util.invalidateTags(['Notification']));
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title || 'New Notification', {
          body: notification.message || 'You have a new notification',
          icon: '/favicon.ico',
          tag: notification.type
        });
      }
    });

    // Also listen for chat notifications to update notification count
    const removeChatNotificationHandler = chatSocketService.socket?.on('chatNotification', (data) => {
      // Only process if it's for the current user
      if (data.userId === user._id) {
        // Invalidate notifications to refetch count
        dispatch(notificationApi.util.invalidateTags(['Notification']));
        
        // Show browser notification for new message
        if (Notification.permission === 'granted') {
          new Notification(`New message from ${data.senderName}`, {
            body: data.messagePreview || 'You have a new message',
            icon: '/favicon.ico',
            tag: 'NEW_MESSAGE'
          });
        }
      }
    });

    // Request notification permission if not already granted
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      clearTimeout(connectionTimer);
      removeNotificationHandler();
      
      // Clean up chat notification listener
      if (chatSocketService.socket) {
        chatSocketService.socket.off('chatNotification');
      }
    };
  }, [token, user?._id, dispatch]);

   useEffect(() => {
    if (!token || !user) {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        dispatch(setCredentials({token: storedToken, user: JSON.parse(storedUser)}));
      }
    }
  }, [token, user, dispatch]);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [notificationsOpen]);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleNotifications = () => setNotificationsOpen(!notificationsOpen);

  const handleNotificationClick = async (notification) => {
    console.log('🔔 Navbar notification clicked:', notification);
    console.log('🔍 Notification type:', notification.type);
    console.log('🔍 Related Product full object:', notification.relatedProduct);
    
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id);
        console.log('✅ Notification marked as read');
      } catch (error) {
        console.error('❌ Failed to mark notification as read:', error);
      }
    }
    
    // Extract product ID from relatedProduct object
    const productId = notification.relatedProduct?._id || notification.relatedProduct;
    console.log('🎯 Extracted Product ID:', productId);
    
    if (!productId) {
      console.error('❌ No product ID found in notification:', notification);
      console.error('❌ Cannot navigate without product ID');
      setNotificationsOpen(false);
      return;
    }
    
    // Navigate based on notification type
    if (notification.type === 'NEW_MESSAGE') {
      // Navigate to chat for this product
      console.log('📨 Navigating to chat:', `/chat/${productId}`);
      navigate(`/chat/${productId}`);
    } else {
      // Navigate to auction detail for all other types (OUTBID, AUCTION_WON, etc.)
      console.log('🏛️ Navigating to auction:', `/auction/${productId}`);
      navigate(`/auction/${productId}`);
    }
    
    setNotificationsOpen(false);
    console.log('🔒 Notification dropdown closed');
  };

  const formatNotificationTime = (createdAt) => {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Remove the old unreadNotificationsCount calculation since we get it from API

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
      dispatch(logout());
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  return (
    <header className="bg-white drop-shadow-2xl relative z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            BidMaster
          </Link>
       

          <div className="hidden md:flex items-center space-x-4">
            {token ? (
              <>
                {user?.role === "admin" ? (
                  // Special Admin Navbar
                  <>
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-200">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user?.fullName || 'Administrator'}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          🛡️ Admin Access
                        </div>
                      </div>
                    </div>
                    
                    <Link 
                      to="/admin" 
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      🔧 Admin Dashboard
                    </Link>

                    <button 
                      onClick={handleLogout}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  // Regular User Navbar
                  <>
                    <div className="relative">
                      <button onClick={toggleNotifications} className="p-2 rounded-full hover:bg-gray-100">
                        <BellIcon className="w-6 h-6 text-gray-600" />
                        {unreadNotificationsCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                          </span>
                        )}
                      </button>
                      {notificationsOpen && (
                        <div 
                          ref={notificationRef}
                          className="fixed top-16 right-4 w-80 bg-white rounded-md shadow-2xl z-[9999] border border-gray-200"
                          style={{ zIndex: 9999 }}
                        >
                          <div className="p-3 border-b bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {notificationsLoading ? (
                              <div className="p-4 text-center text-gray-500">
                                Loading notifications...
                              </div>
                            ) : notifications.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                No notifications yet
                              </div>
                            ) : (
                              notifications.map(notification => (
                                <div 
                                  key={notification._id} 
                                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                                    !notification.isRead ? 'bg-blue-50' : ''
                                  }`}
                                  onClick={() => handleNotificationClick(notification)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{notification.title}</p>
                                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {formatNotificationTime(notification.createdAt)}
                                      </p>
                                    </div>
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="p-2 text-center border-t">
                            <Link 
                              to="/notifications" 
                              className="text-sm text-blue-600 hover:underline"
                              onClick={() => setNotificationsOpen(false)}
                            >
                              View All Notifications
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative group">
                      <Link to="/profile" className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100">
                        {user?.avatar ? (
                          <img src={user.avatar} className="w-8 h-8 rounded-full" alt="Profile" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-gray-600" />
                        )}
                        <span className="hidden md:inline text-sm font-medium capitalize">
                          {user?.fullName || 'Profile'}
                        </span>
                      </Link>
                    </div>

                    <button 
                      onClick={handleLogout}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Logout
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="text-blue-600 hover:text-blue-800">
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <button 
            onClick={toggleMobileMenu} 
            className="md:hidden p-2 rounded-full hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <XIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-3 pb-3 space-y-2">
            {user?.role !== "admin" && (
              <Link 
                to="/" 
                className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={toggleMobileMenu}
              >
                Home
              </Link>
            )}
            
            {token ? (
              <>
                {user?.role === "admin" ? (
                  // Admin Mobile Menu
                  <>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200 mb-3">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {user?.fullName || 'Administrator'}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        🛡️ Admin Access
                      </div>
                    </div>
                    
                    <Link 
                      to="/admin" 
                      className="block py-3 px-4 text-blue-600 hover:bg-blue-50 rounded-md font-medium border border-blue-200"
                      onClick={toggleMobileMenu}
                    >
                      🔧 Admin Dashboard
                    </Link>
                    
                    <button 
                      onClick={() => {
                        handleLogout();
                        toggleMobileMenu();
                      }}
                      className="block w-full text-left py-2 px-4 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  // Regular User Mobile Menu
                  <>
                    {/* Show Dashboard and Create Auction only for sellers */}
                    {(user?.role === "seller" || user?.role === "both") && (
                      <>
                        <Link 
                          to="/dashboard" 
                          className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-md"
                          onClick={toggleMobileMenu}
                        >
                          Dashboard
                        </Link>
                        <Link 
                          to="/create-auction" 
                          className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-md"
                          onClick={toggleMobileMenu}
                        >
                          Create Auction
                        </Link>
                      </>
                    )}
                    
                    {/* Always show these for authenticated users */}
                    <Link 
                      to="/profile" 
                      className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={toggleMobileMenu}
                    >
                      Profile
                    </Link>
                    <Link 
                      to="/chat" 
                      className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={toggleMobileMenu}
                    >
                      Messages
                    </Link>
                    
                    <button 
                      onClick={() => {
                        handleLogout();
                        toggleMobileMenu();
                      }}
                      className="block w-full text-left py-2 px-4 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Logout
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={toggleMobileMenu}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block py-2 px-4 text-blue-600 hover:bg-blue-50 rounded-md"
                  onClick={toggleMobileMenu}
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;