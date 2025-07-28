import express from "express"
import { 
  createChatRoom, 
  getChatById, 
  getUserChat, 
  getAuctionWinnerChat,
  sendAuctionWinnerMessage,
  getUserAuctionChats,
  debugProducts,
  debugCloseAuction,
  debugAuctionStatus
} from "../controllers/chat.controller.js";
import protect from "../middleware/user.middleware.js";

const router = express.Router();

// General chat routes
router.route("/auction/:productId").get(protect, getAuctionWinnerChat)
router.route("/auction/:productId/message").post(protect, sendAuctionWinnerMessage)
router.route("/my-auction-chats").get(protect, getUserAuctionChats)
router.route("/my-chats/:userId").get(protect, getUserChat)
router.route("/:chatId").get(protect, getChatById)
router.route("/").post(protect, createChatRoom)

// Auction winner chat routes

// ✅ Debug routes (remove these in production)
router.route("/debug/products").get(debugProducts)
router.route("/debug/close-auction/:productId").post(debugCloseAuction)
router.route("/debug/auction-status/:productId").get(protect, debugAuctionStatus)

export default router;