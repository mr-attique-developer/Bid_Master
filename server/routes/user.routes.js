import express from "express"
import { getUserProfile, loginUser, logoutUser, registerUser1, registerUser2, updatePassword, updateUserProfile, deleteAccount } from "../controllers/user.controller.js"
import protect from "../middleware/user.middleware.js"

const router = express.Router()
router.route("/register1").post(registerUser1)
router.route("/register2").put(protect,registerUser2)
router.route("/login").post(loginUser)
router.route("/updateProfile").put(protect, updateUserProfile)
router.route("/profile").get(protect, getUserProfile)
router.route("/logout").delete(protect, logoutUser)
router.route("/updatePassword").patch(protect, updatePassword)
router.route("/deleteAccount").delete(protect, deleteAccount)

export default router