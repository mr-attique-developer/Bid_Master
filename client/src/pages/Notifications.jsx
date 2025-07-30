import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon, CheckIcon, TrashIcon } from 'lucide-react';
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation, useDeleteNotificationMutation, notificationApi } from '../services/notificationApi';
import { useDispatch } from 'react-redux';
import LoadingSpinner from '../components/LoadingSpinner';
import chatSocketService from '../services/chatSocketService';

const Notifications = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const notificationsPerPage = 20;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { 
    data: notificationsData, 
    isLoading, 
    error,
    refetch 
  } = useGetNotificationsQuery({
    page: currentPage,
    limit: notificationsPerPage
  });

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  // Setup real-time notifications for this page
  useEffect(() => {
    // Listen for new notifications to refresh the list
    const removeNotificationHandler = chatSocketService.addGeneralNotificationHandler((notification) => {
      console.log('🔔 Real-time notification received in Notifications page:', notification);
      
      // Invalidate RTK Query cache to refetch notifications
      dispatch(notificationApi.util.invalidateTags(['Notification']));
    });

    return () => {
      removeNotificationHandler();
    };
  }, [dispatch]);

  // Keyboard support for modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && deleteConfirmOpen) {
        handleCancelDelete();
      }
    };

    if (deleteConfirmOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [deleteConfirmOpen]);

  const notifications = notificationsData?.notifications || [];
  const totalPages = notificationsData?.pagination?.totalPages || 1;

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    setNotificationToDelete(notificationId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (notificationToDelete) {
      setIsDeleting(true);
      try {
        await deleteNotification(notificationToDelete).unwrap();
        console.log('Notification deleted successfully');
      } catch (error) {
        console.error('Failed to delete notification:', error);
      } finally {
        setIsDeleting(false);
      }
    }
    setDeleteConfirmOpen(false);
    setNotificationToDelete(null);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return; // Prevent closing while deleting
    setDeleteConfirmOpen(false);
    setNotificationToDelete(null);
  };

  const handleNotificationClick = async (notification) => {
    console.log('🔔 Notifications page - notification clicked:', notification);
    console.log('🔍 Related Product:', notification.relatedProduct);
    
    // Mark as read if unread
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }
    
    // Extract product ID from relatedProduct object
    const productId = notification.relatedProduct?._id || notification.relatedProduct;
    console.log('🎯 Extracted Product ID:', productId);
    
    // Navigate based on notification type
    if (notification.type === 'NEW_MESSAGE' && productId) {
      // Navigate to chat for this product
      console.log('📨 Navigating to chat:', `/chat/${productId}`);
      navigate(`/chat/${productId}`);
    } else if (productId) {
      // Navigate to auction detail - using correct route parameter (:id)
      console.log('🏛️ Navigating to auction:', `/auction/${productId}`);
      navigate(`/auction/${productId}`);
    } else {
      console.error('❌ No product ID found in notification:', notification);
    }
  };

  const formatNotificationTime = (createdAt) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
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

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load notifications</p>
          <button 
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BellIcon className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-gray-600">Stay updated with your auction activity</p>
                </div>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    filter === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    filter === 'unread' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    filter === 'read' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Read
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-lg shadow-sm border">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 
                   filter === 'read' ? 'No read notifications' : 
                   'No notifications yet'}
                </h3>
                <p className="text-gray-600">
                  {filter === 'all' 
                    ? "You'll receive notifications for new bids, messages, and auction updates here."
                    : `No ${filter} notifications to display.`
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-sm text-gray-500 mt-2">
                              {formatNotificationTime(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                            title="Mark as read"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          title="Delete notification"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] px-4"
          onClick={isDeleting ? null : handleCancelDelete}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-sm w-full mx-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Notification
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this notification? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
