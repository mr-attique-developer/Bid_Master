import cron from "node-cron";
import Product from "../models/product.model.js";
import Bid from "../models/bid.model.js"
import User from "../models/user.model.js"
import sendEmail from "../utils/email.js"
import Chat from "../models/chat.model.js";
import { createWinnerAnnouncementNotification } from "../utils/notifications.js";

// Import io - we'll set this up
let io;
export const setSocketIOForCron = (socketInstance) => {
  io = socketInstance;
};

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    
    // 🔍 Check for expired listed auctions (normal auction flow)
    const expiredAuctions = await Product.find({
      status: "listed",
      endsAt: { $lte: now },
    }).populate("seller");

    // 🔍 Check for expired pending auctions (payment not made)
    const expiredPendingAuctions = await Product.find({
      status: "pending",
      endsAt: { $lte: now },
    }).populate("seller");

    // Handle expired pending auctions (keep them as pending, don't process)
    for (const product of expiredPendingAuctions) {
      // Notify seller that their auction expired while pending
      if (io) {
        io.emit("pendingAuctionExpired", {
          userId: product.seller._id,
          productTitle: product.title,
          productId: product._id,
          message: "Your auction expired while awaiting admin fee payment"
        });
      }
      
      // Send email notification to seller
      await sendEmail(
        product.seller.email,
        "Auction Expired - Payment Required",
        `⚠️ Your auction for "${product.title}" has expired while awaiting admin fee payment. The auction remains pending and cannot proceed without payment. Please contact support if you still wish to list this auction.`
      );
    }

    // Handle expired listed auctions (normal auction end process)
    for (const product of expiredAuctions) {
      const bids = await Bid.find({ product: product._id }).populate("bidder");

      if (bids.length === 0) {
        // ✅ Set status to closed when no bids (expired auction)
        product.status = "closed";
        await product.save();
        
        // Notify that auction ended with no bids
        if (io) {
          io.emit("auctionExpired", {
            userId: product.seller._id,
            productTitle: product.title,
            productId: product._id
          });

          io.to(`auction-${product._id}`).emit("auctionEnded", {
            productId: product._id,
            productTitle: product.title,
            winnerName: null,
            winningBid: 0,
            status: "expired"
          });
        }
        
        continue;
      }


      const highestBid = bids.reduce((max, bid) =>
        bid.amount > max.amount ? bid : max
      );

      const winner = highestBid.bidder;
      const seller = product.seller;

      // ✅ Update product with winner info and set status to closed
      product.status = "closed";
      product.winner = winner._id;
      product.winningBid = highestBid.amount;
      await product.save();

      // Create winner announcement notification
      try {
        await createWinnerAnnouncedNotification(winner, product, highestBid.amount);
      } catch (notificationError) {
        console.error('Error creating winner notification:', notificationError);
      }

      // Create winner announcement notification
      try {
        await createWinnerAnnouncementNotification(winner, product);
      } catch (notificationError) {
        console.error('Error creating winner announcement notification:', notificationError);
      }

      // Send Socket.IO notifications for auction end
      if (io) {
        // Notify winner
        io.emit("auctionWon", {
          userId: winner._id,
          productTitle: product.title,
          productId: product._id,
          winningBid: highestBid.amount,
          sellerName: seller.fullName
        });

        // Emit real-time notification to winner
        io.emit("notification", {
          userId: winner._id.toString(),
          type: "WINNER_ANNOUNCED",
          title: "🎉 Congratulations! You Won!",
          message: `You won the auction for "${product.title}" with a bid of $${highestBid.amount}`,
          relatedProduct: product._id
        });

        // Notify seller
        io.emit("auctionSold", {
          userId: seller._id,
          productTitle: product.title,
          productId: product._id,
          winningBid: highestBid.amount,
          winnerName: winner.fullName
        });

        // Notify all other bidders that they lost
        for (const bid of bids) {
          if (bid.bidder._id.toString() !== winner._id.toString()) {
            io.emit("auctionLost", {
              userId: bid.bidder._id,
              productTitle: product.title,
              productId: product._id,
              winningBid: highestBid.amount,
              winnerName: winner.fullName
            });
          }
        }

        // Notify all users in auction room that auction ended
        io.to(`auction-${product._id}`).emit("auctionEnded", {
          productId: product._id,
          productTitle: product.title,
          winnerName: winner.fullName,
          winningBid: highestBid.amount,
          status: "closed"
        });
      }

      await sendEmail(
        winner.email,
        "You Won the Auction!",
        `🎉 Congratulations ${winner.fullName}, you won the auction for "${product.title}" with a bid of ${highestBid.amount}. Please contact the seller to proceed.`
      );

      await sendEmail(
        seller.email,
        "Your Auction Has Ended",
        `📦 Your auction for "${product.title}" has ended. The highest bidder is ${winner.fullName} with a bid of ${highestBid.amount}.`
      );

      // ✅ Create chat room using correct schema with seller/winner fields
      let chatRoom = await Chat.findOne({
        product: product._id,
        seller: seller._id,
        winner: winner._id
      });
      
      if (!chatRoom) {
        chatRoom = await Chat.create({
          product: product._id,
          seller: seller._id,
          winner: winner._id,
          participants: [seller._id, winner._id], // For backward compatibility
          messages: []
        });
        await chatRoom.save();
      }
    }
  } catch (error) {
    console.error("Error during auction check:", error);
  }
});
