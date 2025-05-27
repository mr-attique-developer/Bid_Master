import express from "express"
import { createChatRoom, getChatById, getUserChat } from "../controllers/chat.controller.js";
import protect from "../middleware/user.middleware.js";


const router = express.Router();

router.route("/my-chats").get(protect, getUserChat)
router.route("/:chatId").get(protect, getChatById)
router.route("/").post(protect,createChatRoom)

export default router;