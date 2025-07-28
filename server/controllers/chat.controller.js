import Chat from "../models/chat.model.js";
import Product from "../models/product.model.js";
import Bid from "../models/bid.model.js";

// Socket.IO instance
let io;
export const setSocketIO = (socketInstance) => {
  io = socketInstance;
};

// Get auction winner chat for a specific product
export const getAuctionWinnerChat = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    console.log("🔍 Getting auction winner chat for product:", productId);
    console.log("👤 User ID:", userId);

    // Validate MongoDB ObjectId format
    const mongoose = await import('mongoose');
    if (!mongoose.default.Types.ObjectId.isValid(productId)) {
      console.log("❌ Invalid ObjectId format:", productId);
      return res.status(400).json({ message: "Invalid product ID format" });
    }
    const prduct1 = await Product.findById(productId)
    console.log("product1", prduct1)

    // Find the product and check if auction has ended
    const product = await Product.findById(productId).populate("seller", "fullName email");
    console.log("📦 Product found:", product ? "Yes" : "No");
    
    if (!product) {
      console.log("❌ Product not found in database");
      return res.status(404).json({ message: "Product not found" });
    }

    console.log(product)
    console.log("📊 Product status:", product.status);
    console.log("🏆 Product winner:", product.winner);
    console.log("💰 Product winningBid:", product.winningBid);

    // Check if auction is closed and has a winner
    if (product.status !== 'closed' || !product.winner) {
      console.log("❌ Auction not closed or no winner");
      return res.status(400).json({ 
        message: "Auction must be closed and have a winner for chat access" 
      });
    }

    // Get winner and seller IDs
    const winnerId = product.winner.toString();
    const sellerId = product.seller._id.toString();

    console.log("🏆 Winner ID:", winnerId);
    console.log("👨‍💼 Seller ID:", sellerId);
    console.log("👤 Current User ID:", userId.toString());

    // Check if current user is either seller or winner
    if (userId.toString() !== sellerId && userId.toString() !== winnerId) {
      console.log("❌ Access denied - user is not seller or winner");
      return res.status(403).json({ 
        message: "Access denied. Only auction winner and seller can access this chat." 
      });
    }

    console.log("✅ User authorized to access chat");

    // Find existing chat for this auction
    let chat = await Chat.findOne({
      product: productId,
      seller: sellerId,
      winner: winnerId
    })
    .populate("seller", "fullName email")
    .populate("winner", "fullName email")
    .populate("messages.sender", "fullName email")
    .populate("product", "title winningBid images");

    console.log("💬 Existing chat found:", chat ? "Yes" : "No");
    
    if (chat) {
      console.log("🔍 Existing chat details:", {
        seller: chat.seller,
        winner: chat.winner,
        hasMessages: chat.messages?.length > 0
      });
    }

    if (!chat) {
      console.log("🔨 Creating new chat room");
      // Create new chat room using the correct schema
      chat = await Chat.create({
        product: productId,
        seller: sellerId,
        winner: winnerId,
        participants: [sellerId, winnerId], // ✅ Set participants correctly
        messages: [],
      });
      
      await chat.populate([
        { path: "seller", select: "fullName email" },
        { path: "winner", select: "fullName email" },
        { path: "product", select: "title winningBid images" }
      ]);
      
      console.log("✅ New chat room created");
    }

    console.log("📤 Returning chat data:", {
      chatId: chat._id,
      seller: chat.seller,
      winner: chat.winner,
      productInfo: {
        title: product.title,
        winningBid: product.winningBid,
        winner: product.winner,
        seller: product.seller,
      }
    });

    return res.status(200).json({
      message: "Auction winner chat fetched successfully",
      chat,
      product: {
        title: product.title,
        winningBid: product.winningBid,
        winner: product.winner,
        seller: product.seller,
      },
    });
  } catch (error) {
    console.error("❌ Error in getAuctionWinnerChat:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Send message in auction winner chat
export const sendAuctionWinnerMessage = async (req, res) => {
  try {
    const { productId } = req.params;
    const { text } = req.body; // ✅ Changed from 'message' to 'text' to match schema
    const userId = req.user._id;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if auction is closed and has a winner
    if (product.status !== 'closed' || !product.winner) {
      return res.status(400).json({ 
        message: "Auction must be closed and have a winner for chat access" 
      });
    }

    // Get winner and seller IDs
    const winnerId = product.winner.toString();
    const sellerId = product.seller.toString();

    // Check if current user is either seller or winner
    if (userId.toString() !== sellerId && userId.toString() !== winnerId) {
      return res.status(403).json({ 
        message: "Access denied. Only auction winner and seller can send messages." 
      });
    }

    // Find or create the chat
    let chat = await Chat.findOne({
      product: productId,
      seller: sellerId,
      winner: winnerId
    });

    if (!chat) {
      // Create new chat if it doesn't exist
      chat = await Chat.create({
        product: productId,
        seller: sellerId,
        winner: winnerId,
        participants: [sellerId, winnerId], // ✅ Set participants correctly
        messages: [],
      });
    }

    // Add message to chat
    const newMessage = {
      sender: userId,
      text: text.trim(),
      timestamp: new Date(),
    };
    
    chat.messages.push(newMessage);
    await chat.save();
    
    // Populate the new message for real-time broadcast
    await chat.populate([
      { path: "messages.sender", select: "fullName email" },
      { path: "seller", select: "fullName email" },
      { path: "winner", select: "fullName email" },
      { path: "product", select: "title winningBid images" }
    ]);

    // Get the populated message (last message in array)
    const populatedMessage = chat.messages[chat.messages.length - 1];

    // 📡 REAL-TIME: Emit the new message to chat participants
    if (io) {
      const chatRoomId = `auction-chat-${productId}`;
      console.log(`📢 Emitting new message to chat room: ${chatRoomId}`);
      
      // Emit to chat room participants only
      io.to(chatRoomId).emit("newChatMessage", {
        chatId: chat._id,
        productId: productId,
        message: populatedMessage,
        sender: {
          _id: userId,
          fullName: populatedMessage.sender.fullName,
          email: populatedMessage.sender.email
        },
        timestamp: populatedMessage.timestamp
      });

      // Also emit individual notifications to seller and winner
      io.emit("chatNotification", {
        userId: userId.toString() === sellerId ? winnerId : sellerId, // Send to other participant
        productId: productId,
        productTitle: chat.product?.title || "Auction Chat",
        senderName: populatedMessage.sender.fullName,
        messagePreview: text.length > 50 ? text.substring(0, 50) + "..." : text
      });
    }

    return res.status(200).json({
      message: "Message sent successfully",
      chat,
      newMessage: populatedMessage
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserChat = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const userChats = await Chat.find({ participants: userId })
      .populate("participants", "fullName email")
      .populate("product", "title startingPrice images status endsAt")
      .populate("messages.sender", "fullName email");
    
    return res.status(200).json({
      message: "User chats fetched successfully",
      chats: userChats,
    });
  } catch (error) {
    console.error("Error fetching user chat:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ FIXED: Get user's auction winner chats (only for ended auctions where user won or sold)
export const getUserAuctionChats = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log("🔍 Getting auction chats for user:", userId);

    // ✅ Fixed: Use correct field names from the schema
    const chats = await Chat.find({
      $or: [
        { seller: userId },   // ✅ Changed from 'sellerId' to 'seller'
        { winner: userId }    // ✅ Changed from 'winnerId' to 'winner'
      ],
    })
      .populate("seller", "fullName email")     // ✅ Fixed field names
      .populate("winner", "fullName email")     // ✅ Fixed field names
      .populate("product", "title winningBid images status") // ✅ Fixed field name
      .populate("messages.sender", "fullName email")
      .sort({ updatedAt: -1 }); // Sort by most recent

    console.log("💬 Found auction chats:", chats.length);

    return res.status(200).json({
      message: "User auction chats fetched successfully",
      chats: chats
    });
  } catch (error) {
    console.error("❌ getUserAuctionChats error:", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }
    
    const chat = await Chat.findById(chatId)
      .populate("participants", "fullName email")
      .populate("seller", "fullName email")
      .populate("winner", "fullName email")
      .populate("product", "title winningBid images")
      .populate("messages.sender", "fullName email");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    return res.status(200).json({
      message: "Chat fetched successfully",
      chat,
    });
  } catch (error) {
    console.error("Error fetching chat by ID:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createChatRoom = async (req, res) => {
  const { sellerId, winnerId, productId } = req.body;
  try {
    if (!sellerId || !winnerId || !productId) {
      return res
        .status(400)
        .json({ message: "Seller ID, Winner ID, and Product ID are required" });
    }

    console.log("🔨 Creating chat room for:", { sellerId, winnerId, productId });

    // Check if product exists and is closed with a winner
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.status !== 'closed' || !product.winner) {
      return res.status(400).json({ 
        message: "Can only create chat for closed auctions with winners" 
      });
    }

    // Find existing chat
    let chatRoom = await Chat.findOne({
      product: productId,
      seller: sellerId,
      winner: winnerId
    });

    if (!chatRoom) {
      console.log("✨ Creating new chat room");
      chatRoom = await Chat.create({
        product: productId,
        seller: sellerId,
        winner: winnerId,
        participants: [sellerId, winnerId], // ✅ Set participants correctly
        messages: [],
      });
    } else {
      console.log("✅ Chat room already exists");
    }

    await chatRoom.populate([
      { path: "seller", select: "fullName email" },
      { path: "winner", select: "fullName email" },
      { path: "product", select: "title winningBid images" }
    ]);

    return res.status(201).json({
      message: "Chat room created successfully",
      chatRoom,
    });
  } catch (error) {
    console.error("❌ Error creating chat room:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Debug endpoint to check products (temporary)
export const debugProducts = async (req, res) => {
  try {
    console.log("🔍 Debug: Checking all products");
    const products = await Product.find({}).select("title status winner winningBid seller").limit(10);
    console.log("📦 Found products:", products.length);
    
    products.forEach((product, index) => {
      console.log(`Product ${index + 1}:`, {
        id: product._id,
        title: product.title,
        status: product.status,
        hasWinner: !!product.winner,
        winningBid: product.winningBid
      });
    });

    return res.status(200).json({
      message: "Debug info",
      totalProducts: products.length,
      products: products.map(p => ({
        id: p._id,
        title: p.title,
        status: p.status,
        hasWinner: !!p.winner,
        winningBid: p.winningBid
      }))
    });
  } catch (error) {
    console.error("❌ Debug error:", error);
    return res.status(500).json({ message: "Debug error", error: error.message });
  }
};

// Debug endpoint to simulate closing an auction (temporary)
export const debugCloseAuction = async (req, res) => {
  try {
    const { productId } = req.params;
    
    console.log("🔧 Debug: Manually closing auction for product:", productId);
    
    // Find the product
    const product = await Product.findById(productId).populate("seller");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Find highest bid for this product
    const bids = await Bid.find({ product: productId }).populate("bidder");
    
    if (bids.length === 0) {
      // No bids - just close the auction
      product.status = "closed";
      await product.save();
      
      return res.status(200).json({
        message: "Auction closed with no bids",
        product: {
          id: product._id,
          title: product.title,
          status: product.status,
          winner: null,
          winningBid: null
        }
      });
    }
    
    // Find highest bid
    const highestBid = bids.reduce((max, bid) => 
      bid.amount > max.amount ? bid : max
    );
    
    // Update product with winner info
    product.status = "closed";
    product.winner = highestBid.bidder._id;
    product.winningBid = highestBid.amount;
    await product.save();
    
    // Create chat room
    let chatRoom = await Chat.findOne({
      product: productId,
      seller: product.seller._id,
      winner: highestBid.bidder._id
    });
    
    if (!chatRoom) {
      chatRoom = await Chat.create({
        product: productId,
        seller: product.seller._id,
        winner: highestBid.bidder._id,
        participants: [product.seller._id, highestBid.bidder._id],
        messages: []
      });
    }

    console.log("🎯 Debug: Auction closed successfully:", {
      productId: product._id,
      title: product.title,
      winner: highestBid.bidder.fullName,
      winningBid: highestBid.amount,
      status: product.status,
      chatRoomCreated: !!chatRoom
    });

    return res.status(200).json({
      message: "Auction closed successfully",
      product: {
        id: product._id,
        title: product.title,
        status: product.status,
        winner: {
          id: highestBid.bidder._id,
          name: highestBid.bidder.fullName
        },
        winningBid: highestBid.amount,
        seller: {
          id: product.seller._id,
          name: product.seller.fullName
        }
      },
      chatRoom: {
        id: chatRoom._id,
        created: true
      }
    });
  } catch (error) {
    console.error("❌ Error closing auction:", error);
    return res.status(500).json({ message: "Error closing auction", error: error.message });
  }
};

// 🔍 Debug endpoint to check auction status and winner assignment
export const debugAuctionStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    console.log("🔍 Debug: Checking auction status for product:", productId);
    console.log("👤 Debug: Current user ID:", userId);

    // Find the product
    const product = await Product.findById(productId).populate("seller", "fullName email");
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get all bids for this auction
    const bids = await Bid.find({ product: productId })
      .populate("bidder", "fullName email")
      .sort({ amount: -1 }); // Sort by amount descending

    const highestBid = bids.length > 0 ? bids[0] : null;
    const userBids = bids.filter(bid => bid.bidder._id.toString() === userId.toString());
    const userHighestBid = userBids.length > 0 ? userBids[0] : null;
    
    // Check if current user is the highest bidder
    const isUserHighestBidder = highestBid && highestBid.bidder._id.toString() === userId.toString();

    // Check auction end time
    const now = new Date();
    const hasEnded = new Date(product.endsAt) <= now;

    return res.status(200).json({
      debug: {
        productId: product._id,
        productTitle: product.title,
        productStatus: product.status,
        hasWinner: !!product.winner,
        winnerId: product.winner,
        winningBid: product.winningBid,
        auctionEndTime: product.endsAt,
        hasAuctionEnded: hasEnded,
        timeLeft: hasEnded ? "Ended" : `Ends at ${product.endsAt}`,
        
        // Current user info
        currentUserId: userId,
        isUserSeller: product.seller._id.toString() === userId.toString(),
        isUserHighestBidder,
        
        // Bidding info
        totalBids: bids.length,
        highestBidAmount: highestBid?.amount || 0,
        highestBidderName: highestBid?.bidder?.fullName || "No bids",
        highestBidderId: highestBid?.bidder?._id || null,
        
        userBidsCount: userBids.length,
        userHighestBidAmount: userHighestBid?.amount || 0,
        
        // What needs to happen for chat access
        chatAccessRequirements: {
          needsStatus: "closed",
          currentStatus: product.status,
          statusOk: product.status === "closed",
          
          needsWinner: "assigned",
          hasWinner: !!product.winner,
          winnerOk: !!product.winner,
          
          bothRequirementsMet: product.status === "closed" && !!product.winner
        },
        
        // Action needed
        nextSteps: getNextSteps(product, hasEnded, isUserHighestBidder, bids.length)
      }
    });

  } catch (error) {
    console.error("Error in debug auction status:", error);
    return res.status(500).json({ message: "Error checking auction status", error: error.message });
  }
};

// Helper function to determine what needs to happen next
const getNextSteps = (product, hasEnded, isUserHighestBidder, bidCount) => {
  const steps = [];
  
  if (!hasEnded) {
    steps.push("⏳ Wait for auction to end");
  }
  
  if (hasEnded && product.status === "listed") {
    if (bidCount === 0) {
      steps.push("❌ Auction ended with no bids - cannot be closed");
    } else {
      steps.push("🔄 Auction needs to be closed (automatic process should handle this)");
      steps.push("🏆 Winner needs to be assigned to highest bidder");
    }
  }
  
  if (hasEnded && product.status === "pending") {
    steps.push("💳 Seller needs to pay admin fee first");
    steps.push("📋 Admin needs to change status from 'pending' to 'listed'");
  }
  
  if (product.status === "closed" && !product.winner) {
    steps.push("🏆 Winner assignment is missing - contact admin");
  }
  
  if (product.status === "closed" && product.winner) {
    if (isUserHighestBidder) {
      steps.push("✅ Chat access should be available!");
    } else {
      steps.push("❌ You are not the winner of this auction");
    }
  }
  
  return steps;
};