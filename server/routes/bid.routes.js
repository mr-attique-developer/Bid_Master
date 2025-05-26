import express from "express"
import protect from "../middleware/user.middleware.js"
import { placeBid } from "../controllers/bid.controller.js"

const router = express.Router()
router.route("/place/:productId").post(protect,placeBid)


export default router