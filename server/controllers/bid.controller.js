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
