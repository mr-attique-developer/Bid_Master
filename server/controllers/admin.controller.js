import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import Bid from '../models/bid.model.js';
import Notification from '../models/notification.model.js';
import Chat from '../models/chat.model.js';

// Admin Dashboard Stats
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalBids = await Bid.countDocuments();
    const pendingProducts = await Product.countDocuments({ status: 'pending' });
    const listedProducts = await Product.countDocuments({ status: 'listed' });
    const soldProducts = await Product.countDocuments({ status: 'sold' });
    const endedProducts = await Product.countDocuments({ status: 'ended' });
    
    // Revenue calculations
    const adminFeeCollected = await Product.countDocuments({ adminFeePaid: true });
    const adminFeePending = await Product.countDocuments({ adminFeePaid: false, status: { $in: ['listed', 'sold', 'ended'] } });

    // Recent activity
    const recentUsers = await User.find()
      .select('fullName email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentProducts = await Product.find()
      .populate('seller', 'fullName email')
      .select('title status createdAt adminFeePaid')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          buyers: await User.countDocuments({ role: 'buyer' }),
          sellers: await User.countDocuments({ role: 'seller' }),
          both: await User.countDocuments({ role: 'both' }),
          admins: await User.countDocuments({ role: 'admin' })
        },
        products: {
          total: totalProducts,
          pending: pendingProducts,
          listed: listedProducts,
          sold: soldProducts,
          ended: endedProducts
        },
        revenue: {
          feeCollected: adminFeeCollected,
          feePending: adminFeePending
        },
        totalBids
      },
      recentActivity: {
        users: recentUsers,
        products: recentProducts
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard stats'
    });
  }
};

// Get All Users with Pagination
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    let query = {};
    
    // Filter by role if specified
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -confirmPassword')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    // Delete user's products, bids, and related data
    await Product.deleteMany({ seller: userId });
    await Bid.deleteMany({ bidder: userId });
    await Notification.deleteMany({ user: userId });
    await Chat.deleteMany({ $or: [{ seller: userId }, { buyer: userId }] });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User and all related data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// Get All Products with Pagination
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, adminFeePaid } = req.query;
    
    let query = {};
    
    // Filter by status if specified
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by admin fee payment status
    if (adminFeePaid !== undefined) {
      query.adminFeePaid = adminFeePaid === 'true';
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('seller', 'fullName email')
      .populate('winner', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

// Update Product Status
export const updateProductStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'listed', 'closed', 'sold', 'ended', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { status },
      { new: true, runValidators: true }
    ).populate('seller', 'fullName email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product status updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product status'
    });
  }
};

// Update Admin Fee Payment Status
export const updateAdminFeeStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const { adminFeePaid } = req.body;

    const product = await Product.findByIdAndUpdate(
      productId,
      { adminFeePaid },
      { new: true, runValidators: true }
    ).populate('seller', 'fullName email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin fee status updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating admin fee status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin fee status'
    });
  }
};

// Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete related bids, notifications, and chats
    await Bid.deleteMany({ product: productId });
    await Notification.deleteMany({ relatedProduct: productId });
    await Chat.deleteMany({ product: productId });

    // Delete the product
    await Product.findByIdAndDelete(productId);

    res.status(200).json({
      success: true,
      message: 'Product and all related data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

// Update Product End Date
export const updateProductEndDate = async (req, res) => {
  try {
    const { productId } = req.params;
    const { endsAt } = req.body;

    // Validate the date
    const endDate = new Date(endsAt);
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Ensure the end date is in the future
    if (endDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'End date must be in the future'
      });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { endsAt: endDate },
      { new: true, runValidators: true }
    ).populate('seller', 'fullName email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product end date updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product end date:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product end date'
    });
  }
};

// Update User Role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['buyer', 'seller', 'both', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: buyer, seller, both, admin'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent changing your own role if you're an admin
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }

    // Update the user role
    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
};
