import cron from "node-cron";
import Product from "../models/product.model.js";
import Bid from "../models/bid.model.js"
import User from "../models/user.model.js"
import sendEmail from "../utils/email.js"
import Chat from "../models/chat.model.js";

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const expiredAuctions = await Product.find({
      status: "listed",
      endsAt: { $lte: now },
    }).populate("seller");

    for (const product of expiredAuctions) {
      const bids = await Bid.find({ product: product._id }).populate("bidder");

      if (bids.length === 0) {
        product.status = "sold";
        await product.save();
        continue;
      }


      const highestBid = bids.reduce((max, bid) =>
        bid.amount > max.amount ? bid : max
      );
      console.log(highestBid)

      const winner = highestBid.bidder;
      const seller = product.seller;

      product.status = "sold";
      await product.save();

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

      let chatRoom = await Chat.findOne({
        participants: { $all: [winner._id, seller._id] }
      })
      if(!chatRoom) {
        chatRoom = await  Chat.create({
          participants: [winner._id, seller._id],
          messages: [],
          product: product._id
        });
        await chatRoom.save();
      }
      // TODO: Optionally create a chat room between seller and winner
    }

    console.log("✅ Auction check complete");
  } catch (error) {
    console.error("Error during auction check:", error);
  }
});
