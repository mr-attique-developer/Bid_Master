import express from 'express';
import protect from '../middleware/user.middleware.js';
import { adminOnly } from '../middleware/admin.middleware.js';
import {
  getAdminStats,
  getAllUsers,
  deleteUser,
  getAllProducts,
  updateProductStatus,
  updateAdminFeeStatus,
  deleteProduct,
  updateProductEndDate,
  updateUserRole
} from '../controllers/admin.controller.js';

const router = express.Router();

// Apply authentication and admin-only middleware to all routes
router.use(protect);
router.use(adminOnly);

// Dashboard Stats
router.get('/stats', getAdminStats);

// User Management Routes
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

// Product Management Routes
router.get('/products', getAllProducts);
router.put('/products/:productId/status', updateProductStatus);
router.put('/products/:productId/admin-fee', updateAdminFeeStatus);
router.put('/products/:productId/end-date', updateProductEndDate);
router.delete('/products/:productId', deleteProduct);

export default router;
