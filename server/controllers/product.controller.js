import { cloudinary } from "../config/cloudinaryConfig.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Bid from "../models/bid.model.js";
import sendEmail from "../utils/email.js";

// Function to determine auction winner and update product
export const determineAuctionWinner = async (productId) => {
  try {
    const product = await Product.findById(productId).populate("seller", "fullName email");
    if (!product) return null;

    // Check if auction has ended
    const now = new Date();
    if (product.endsAt && new Date(product.endsAt) <= now && product.status === "listed") {
      // Find the highest bid
      const highestBid = await Bid.findOne({ product: productId })
        .sort({ amount: -1 })
        .populate("bidder", "fullName email");

      if (highestBid) {
        // Update product with winner information
        product.winner = highestBid.bidder._id;
        product.winningBid = highestBid.amount;
        product.status = "closed"; // ✅ Changed from "sold" to "closed"
        await product.save();

        // Send notification emails
        try {
          // Email to winner
          await sendEmail(
            highestBid.bidder.email,
            "Congratulations! You Won the Auction",
            `Hi ${highestBid.bidder.fullName},\n\nCongratulations! You have won the auction for "${product.title}" with a bid of ₨${highestBid.amount}.\n\nPlease contact the seller to arrange payment and delivery. You can now chat with the seller through our platform.\n\nThank you for using BidMaster!`
          );

          // Email to seller
          await sendEmail(
            product.seller.email,
            "Your Auction Has Ended",
            `Hi ${product.seller.fullName},\n\nYour auction for "${product.title}" has ended. The winning bid is ₨${highestBid.amount} by ${highestBid.bidder.fullName}.\n\nPlease contact the winner to arrange payment and delivery. You can now chat with the winner through our platform.\n\nThank you for using BidMaster!`
          );
        } catch (emailError) {
          console.error("Error sending winner notification emails:", emailError);
        }

        return {
          product,
          winner: highestBid.bidder,
          winningBid: highestBid.amount,
        };
      } else {
        // No bids, auction ended without winner
        product.status = "listed"; // Keep as listed or create "expired" status
        await product.save();
      }
    }

    return null;
  } catch (error) {
    console.error("Error determining auction winner:", error);
    return null;
  }
};

// Socket.IO instance
let io;
export const setSocketIO = (socketInstance) => {
  io = socketInstance;
};

export const createProduct = async (req, res) => {
  try {
    // Add debugging to see what's being received
    console.log("📋 Creating product:", req.body.title);
    
    const {
      title,
      description,
      startingPrice,
      minBidIncrement,
      bidDuration,
      location,
      category,
      condition,
    } = req.body;

    // Convert bidDuration to number if it's a string
    const parsedBidDuration = Number(bidDuration);

    // Validate bidDuration is one of the allowed values
    const allowedDurations = [3, 5, 7, 10, 14, 30];
    if (!allowedDurations.includes(parsedBidDuration)) {
      return res
        .status(400)
        .json({ 
          success: false, 
          message: `Invalid bid duration. Must be one of: ${allowedDurations.join(', ')} days. Received: ${parsedBidDuration}` 
        });
    }

    if (
      !title ||
      !description ||
      !startingPrice ||
      !minBidIncrement ||
      !bidDuration ||
      !location ||
      !category ||
      !condition
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all the fields" });
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload at least one image" });
    }

    const sellerId = req.user._id;
    const image = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));

    // Calculate endsAt robustly
    const endsAt = new Date(Date.now() + Number(parsedBidDuration) * 24 * 60 * 60 * 1000);

    const product = await Product.create({
      title,
      description,
      image,
      startingPrice,
      minBidIncrement,
      bidDuration: parsedBidDuration, // Use the parsed number
      location,
      category,
      condition,
      seller: sellerId,
      adminFeePaid: false,
      status: "pending",
      endsAt,
    });

    console.log("✅ Product created successfully:", product._id);

    // Send immediate response to user first
    res.status(201).json({
      success: true,
      message: "Product Created Successfully",
      product,
    });

    // Handle email notifications asynchronously (non-blocking)
    (async () => {
      try {
        // Send email to seller
        await sendEmail(
          req.user.email,
          "Pay 5% Admin Fee to List Your Product",
          `Hi ${req.user.fullName},\n\nYour product has been saved as 'Pending'.\nTo list it for bidding, please pay the 5% admin fee via JazzCash or EasyPaisa, then send the receipt to the admin on WhatsApp.\n\nPlease send the receipt here: https://wa.me/923164963275\n\nThank you!`
        );

        // Notify other users via email in background (batch processing)
        const users = await User.find({ _id: { $ne: sellerId } }).select("email").limit(50); // Limit to prevent overwhelming
        
        // Send emails in batches to avoid overloading email service
        const emailPromises = users.map(user => 
          sendEmail(
            user.email,
            "New Product Added",
            `A new product has been added by ${req.user.fullName}, auction titled "${title}". Check it out!`
          ).catch(err => console.error(`Failed to send email to ${user.email}:`, err))
        );

        // Process all emails concurrently instead of sequentially
        await Promise.allSettled(emailPromises);
        console.log(`📧 Sent notification emails to ${users.length} users`);
      } catch (error) {
        console.error("Background email processing error:", error);
      }
    })();

    // Emit real-time notification immediately (this is fast)
    if (io) {
      console.log(`📢 Emitting productListed event for product: ${product._id}`);
      
      // Notify all connected users about new product listing
      io.emit("productListed", {
        productId: product._id,
        productTitle: title,
        sellerName: req.user.fullName,
        sellerId: sellerId.toString(),
        category: category,
        startingPrice: startingPrice,
        image: image[0]?.url // First image for notification
      });

      console.log(`📢 Emitted productListed globally for: ${title}`);
    }
  } 
 catch (error) {
  console.error(error);
  res.status(500).json({ success: false, message: error.message || "Error in creating Product" });
}
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).populate(
      "seller",
      "fullName email"
    );
    
    console.log(`📊 getAllProducts: Found ${products.length} products`);
    
    // ✅ Add bid count for each product
    const productsWithBidCount = await Promise.all(
      products.map(async (product) => {
        // Get bid count for this product
        const bidCount = await Bid.countDocuments({ product: product._id });
        
        // Get current highest bid
        const highestBid = await Bid.findOne({ product: product._id })
          .sort({ amount: -1 })
          .select('amount');
        
        // Convert to plain object and add bid info
        const productObj = product.toObject();
        productObj.bidCount = bidCount;
        productObj.currentBid = highestBid ? highestBid.amount : product.startingPrice;
        
        return productObj;
      })
    );
    
    console.log(`✅ Added bid counts for ${productsWithBidCount.length} products`);
    
    res
      .status(200)
      .json({
        count: products.length, // Fixed: was Product.length, should be products.length
        success: true,
        message: "Products fetched successfully",
        products: productsWithBidCount,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error in fetching Products" });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate(
      "seller",
      "fullName email"
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res
      .status(200)
      .json({
        success: true,
        message: "Product fetched successfully",
        product,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error in fetching Product" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate(
      "seller",
      "fullName email"
    );
    console.log(product);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    if (product.seller._id.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({
          success: false,
          message: "You are not authorized to delete this product",
        });
    }
    await Product.findByIdAndDelete(id);
    for (const img of product.image) {
      cloudinary.uploader.destroy(img.public_id);
    }
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error in deleting Product" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate(
      "seller",
      "fullName email"
    );
    console.log(product);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    if (product.seller._id.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({
          success: false,
          message: "You are not authorized to update this product",
        });
    }
    const {
      title,
      description,
      startingPrice,
      minBidIncrement,
      bidDuration,
      location,
      category,
      condition,
    } = req.body;
    if (
      !title ||
      !description ||
      !startingPrice ||
      !minBidIncrement ||
      !bidDuration ||
      !location ||
      !category ||
      !condition
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all the fields" });
    }
    console.log(
      title,
      description,
      startingPrice,
      minBidIncrement,
      bidDuration,
      location,
      category,
      condition
    );
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload at least one image" });
    }
    const image = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
    product.title = title;
    product.description = description;
    product.image = image;
    product.startingPrice = startingPrice;
    product.minBidIncrement = minBidIncrement;
    product.bidDuration = bidDuration;
    product.location = location;
    product.category = category;
    product.condition = condition;
    await product.save();
    res
      .status(200)
      .json({
        success: true,
        message: "Product updated successfully",
        product,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error in updating Product" });
  }
};



export const verifyAdminFee = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const now = new Date()
   const endsAt = new Date(now.getTime() + product.bidDuration * 24 * 60 * 60 * 1000); // add bid duration days
    product.adminFeePaid = true
    product.status = "listed"
    product.endsAt = endsAt


    await product.save();

    res.status(200).json({ success: true, message: "Admin fee verified and product is now listed", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error verifying admin fee" });
  }
};
