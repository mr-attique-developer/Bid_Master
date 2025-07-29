import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationUnreadCount,
  deleteNotification,
  createTestNotification
} from '../controllers/notification.controller.js';
import protect from '../middleware/user.middleware.js';


const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user notifications
router.get('/', getUserNotifications);

// Get unread count
router.get('/unread-count', getNotificationUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', markNotificationAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllNotificationsAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

// Test notification (for debugging)
router.post('/test', createTestNotification);

export default router;
