import Bid from "../models/bid.model.js";
import Product from "../models/product.model.js";

export const placeBid = async (req, res) => {
  try {
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
      .populate("product", "title image startingPrice currentBid status")
      .populate("bidder", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "User bids retrieved successfully",
      bids: bids,
      totalBids: bids.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error in retrieving user bids",
    });
  }
};
