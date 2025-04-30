import express from "express"
import { registerUser1, registerUser2 } from "../controllers/user.controller.js"

const router = express.Router()
router.route("/register1").post(registerUser1)
router.route("/register2").post(registerUser2)

export default router