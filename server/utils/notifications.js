import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';

// Socket.IO instance
let io;
export const setNotificationSocketIO = (socketInstance) => {
  io = socketInstance;
};

// Create notification function
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedProduct = null,
  relatedBid = null,
  relatedUser = null,
  data = {}
}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedProduct,
      relatedBid,
      relatedUser,
      data
    });

    // Populate the notification
    await notification.populate([
      { path: 'relatedProduct', select: 'title images' },
      { path: 'relatedBid', select: 'amount' },
      { path: 'relatedUser', select: 'fullName' }
    ]);

    // Emit real-time notification if socket is available
    if (io) {
      const userRoom = `user-${userId}`;
      
      io.to(userRoom).emit('newNotification', {
        notification,
        unreadCount: await getUnreadCount(userId)
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get unread count for user
export const getUnreadCount = async (userId) => {
  try {
    return await Notification.countDocuments({ user: userId, isRead: false });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Notification types and their templates
export const NotificationTypes = {
  NEW_PRODUCT: 'new_product',
  NEW_BID: 'new_bid',
  WINNER_ANNOUNCED: 'winner_announced',
  NEW_MESSAGE: 'new_message',
  OUTBID: 'outbid',
  AUCTION_ENDING: 'auction_ending'
};

// Notification creators for specific events
export const createNewProductNotification = async (product) => {
  try {
    // Get all users except the seller
    const users = await User.find({ 
      _id: { $ne: product.seller._id },
      role: { $in: ['buyer', 'both'] } // Only notify buyers
    }).select('_id');

    // Create notifications for all users
    const notificationPromises = users.map(user => 
      createNotification({
        userId: user._id,
        type: NotificationTypes.NEW_PRODUCT,
        title: 'New Auction Listed',
        message: `${product.seller.fullName || 'Someone'} listed a new auction: "${product.title}"`,
        relatedProduct: product._id,
        data: { 
          productTitle: product.title,
          sellerName: product.seller.fullName,
          startingPrice: product.startingPrice,
          category: product.category
        }
      })
    );

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error creating new product notifications:', error);
    throw error;
  }
};

export const createNewBidNotification = async (bid, product, seller) => {
  // Check if notification already exists for this bid
  const existingNotification = await Notification.findOne({
    user: seller._id,
    type: NotificationTypes.NEW_BID,
    relatedBid: bid._id,
    relatedProduct: product._id
  });

  if (existingNotification) {
    return existingNotification;
  }
  
  // Get bidder name from the populated bid object
  const bidderName = bid.bidder?.fullName || bid.bidder?.name || 'Someone';
  
  const notification = await createNotification({
    userId: seller._id,
    type: NotificationTypes.NEW_BID,
    title: 'New Bid Received',
    message: `${bidderName} placed a bid of $${bid.amount} on your "${product.title}"`,
    relatedProduct: product._id,
    relatedBid: bid._id,
    relatedUser: bid.bidder,
    data: { bidAmount: bid.amount, bidderName }
  });
  
  return notification;
};

export const createOutbidNotification = async (previousBidder, product, newBidAmount, newBidder = null) => {
  // Check if a recent outbid notification already exists (within last 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const existingNotification = await Notification.findOne({
    user: previousBidder._id,
    type: NotificationTypes.OUTBID,
    relatedProduct: product._id,
    createdAt: { $gte: fiveMinutesAgo }
  });

  if (existingNotification) {
    return existingNotification;
  }

  // Get the new bidder's name if available
  const newBidderName = newBidder?.fullName || newBidder?.name || 'Someone';
  const message = newBidder 
    ? `${newBidderName} outbid you on "${product.title}" with a bid of $${newBidAmount}`
    : `Your bid on "${product.title}" has been outbid with $${newBidAmount}`;

  const notification = await createNotification({
    userId: previousBidder._id,
    type: NotificationTypes.OUTBID,
    title: 'You\'ve been outbid!',
    message: message,
    relatedProduct: product._id,
    relatedUser: newBidder?._id || null,
    data: { newBidAmount, newBidderName }
  });
  
  return notification;
};

export const createWinnerAnnouncementNotification = async (winner, product) => {
  await createNotification({
    userId: winner._id,
    type: NotificationTypes.WINNER_ANNOUNCED,
    title: 'Congratulations! You won!',
    message: `You won the auction for "${product.title}" with your bid of $${product.winningBid}`,
    relatedProduct: product._id,
    data: { winningBid: product.winningBid }
  });
};

export const createNewMessageNotification = async (recipient, sender, product, messagePreview) => {
  await createNotification({
    userId: recipient._id,
    type: NotificationTypes.NEW_MESSAGE,
    title: 'New Message',
    message: `${sender.fullName} sent you a message about "${product.title}": ${messagePreview}`,
    relatedProduct: product._id,
    relatedUser: sender._id,
    data: { messagePreview }
  });
};
