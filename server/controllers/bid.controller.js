import Bid from "../models/bid.model.js";
import Product from "../models/product.model.js";
import { 
  createNewBidNotification, 
  createOutbidNotification 
} from "../utils/notifications.js";

// Import io from index.js (we'll need to set this up)
let io;
export const setSocketIO = (socketInstance) => {
  io = socketInstance;
};

export const placeBid = async (req, res) => {
  try {
    console.log(`🎯 placeBid called for user ${req.user._id} on product ${req.params.productId} with amount ${req.body.amount}`);
    
    const { amount } = req.body;
    const { productId } = req.params;
    const userId = req.user._id;
    if (!amount || !productId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please provide all required fields",
        });
    }
    const product = await Product.findById(productId).populate(
      "seller",
      "fullName email"
    );
    if (!product || product.status !== "listed" || !product.adminFeePaid) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Product not found or not available for bidding",
        });
    }

    // 🚫 SELLER PROTECTION: Prevent sellers from bidding on their own products
    if (product.seller._id.toString() === userId.toString()) {
      console.log('🚫 Seller attempted to bid on own product:', {
        sellerId: product.seller._id.toString(),
        userId: userId.toString(),
        productId: productId,
        productTitle: product.title
      });
      return res
        .status(403)
        .json({
          success: false,
          message: "You cannot bid on your own auction",
        });
    }

    const highestBid = await Bid.findOne({ product: productId })
      .sort({ amount: -1 })
      .limit(1);
    if (highestBid && amount <= highestBid.amount) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Bid amount must be higher than the current highest bid",
        });
    }
    const minBid = highestBid
      ? highestBid.amount + product.minBidIncrement
      : product.startingPrice;
    if (amount < minBid) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Bid amount must be at least ${minBid}`,
        });
    }
    const newBid = await Bid.create({
      product: productId,
      bidder: userId,
      amount: amount,
    });

    // Populate the bid with bidder info for socket emission
    const populatedBid = await Bid.findById(newBid._id)
      .populate("bidder", "fullName email")
      .populate("product", "title");

    // Emit real-time notification to all users in the auction room
    if (io) {
      console.log(`📢 Emitting newBid event for auction-${productId}`);
      
      // 1. Notify all users in the auction room about the new bid
      io.to(`auction-${productId}`).emit("newBid", {
        bid: populatedBid,
        productTitle: product.title,
        bidderName: populatedBid.bidder.fullName,
        amount: amount,
        productId: productId
      });

      // 2. Also emit to ALL connected users (global notification)
      io.emit("globalBidUpdate", {
        bid: populatedBid,
        productTitle: product.title,
        bidderName: populatedBid.bidder.fullName,
        amount: amount,
        productId: productId,
        sellerId: product.seller._id.toString()
      });

      console.log(`📢 Emitted newBid to auction room: auction-${productId} and globally`);

      // Get all previous bidders who were outbid
      const previousBids = await Bid.find({ 
        product: productId, 
        amount: { $lt: amount } 
      }).populate("bidder", "_id fullName");

      console.log(`📢 Found ${previousBids.length} previous bidders to notify`);

      // Notify each outbid user individually
      for (const prevBid of previousBids) {
        if (prevBid.bidder._id.toString() !== userId.toString()) {
          console.log(`📢 Emitting userOutbid to user: ${prevBid.bidder._id}`);
          
          io.emit("userOutbid", {
            userId: prevBid.bidder._id.toString(),
            productTitle: product.title,
            productId: productId,
            newHighestBid: amount,
            outbidBy: populatedBid.bidder.fullName
          });

          // Create outbid notification
          try {
            await createOutbidNotification(prevBid.bidder, product, amount);
            console.log(`✅ Created outbid notification for user: ${prevBid.bidder._id}`);
          } catch (notificationError) {
            console.error('Error creating outbid notification:', notificationError);
          }
        }
      }
    } else {
      console.warn('⚠️ Socket.IO instance not available in bid controller');
    }

    // Create new bid notification for seller
    try {
      await createNewBidNotification(populatedBid, product, product.seller);
      console.log('✅ Created new bid notification for seller');
    } catch (notificationError) {
      console.error('Error creating new bid notification:', notificationError);
    }

    return res
      .status(201)
      .json({ success: true, message: "Bid placed successfully", bid: newBid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error in placing bid" });
  }
};

export const getAllBids = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Get all bids for the product, sorted by amount (highest first) and populate bidder info
    const bids = await Bid.find({ product: productId })
      .populate("bidder", "fullName email")
      .sort({ amount: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Bids retrieved successfully",
      bids: bids,
      totalBids: bids.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error in retrieving bids",
    });
  }
};

export const getUserBids = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all bids placed by the current user
    const bids = await Bid.find({ bidder: userId })
      .populate("product", "title image startingPrice currentBid status winner winningBid endsAt")
      .populate("bidder", "fullName email")
      .sort({ createdAt: -1 });

    // Calculate won auctions
    const wonAuctions = bids.filter(bid => 
      bid.product && 
      bid.product.winner && 
      bid.product.winner.toString() === userId.toString()
    );

    return res.status(200).json({
      success: true,
      message: "User bids retrieved successfully",
      bids: bids,
      totalBids: bids.length,
      wonAuctions: wonAuctions.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error in retrieving user bids",
    });
  }
};
