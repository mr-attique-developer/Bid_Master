import express from "express"
import protect from "../middleware/user.middleware.js"
import { placeBid, getAllBids, getUserBids } from "../controllers/bid.controller.js"

const router = express.Router()
router.route("/place/:productId").post(protect, placeBid)
router.route("/product/:productId").get(getAllBids)
router.route("/user").get(protect, getUserBids)


export default router