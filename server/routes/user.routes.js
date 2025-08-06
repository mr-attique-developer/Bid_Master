import express from "express"
import { getUserProfile, loginUser, logoutUser, registerUser1, registerUser2, updatePassword, updateUserProfile, deleteAccount, verifyEmail, resendVerificationEmail } from "../controllers/user.controller.js"
import protect from "../middleware/user.middleware.js"
import User from "../models/user.model.js"
import jwt from "jsonwebtoken"

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN})
}

const router = express.Router()
router.route("/register1").post(registerUser1)
router.route("/register2").put(protect,registerUser2)
router.route("/verify-email/:token").get(verifyEmail)
router.route("/check-verification-status/:email").get(async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email: decodeURIComponent(email) });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        if (user.isEmailVerified) {
            // Generate JWT token for authenticated session
            const jwtToken = generateToken(user._id);
            res.cookie("token", jwtToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            
            return res.status(200).json({
                success: true,
                message: "Email is already verified. Please complete your registration.",
                user: {
                    _id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    isEmailVerified: user.isEmailVerified,
                    isActive: user.isActive
                },
                token: jwtToken
            });
        }
        
        res.status(200).json({
            success: false,
            message: "Email not yet verified"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
})
router.route("/resend-verification").post(resendVerificationEmail)
router.route("/test-verification/:token").get((req, res) => {
    res.json({
        message: "Test route working",
        token: req.params.token,
        tokenLength: req.params.token.length,
        timestamp: new Date().toISOString()
    });
})
router.route("/debug-token/:token").get(async (req, res) => {
    try {
        const { token } = req.params;
        console.log('=== TOKEN DEBUG ROUTE ===');
        console.log('Received token:', token);
        console.log('Token length:', token.length);
        
        // Find any user with this token
        const userWithToken = await User.findOne({
            emailVerificationToken: token
        });
        
        // Find all users with verification tokens
        const allUsersWithTokens = await User.find({
            emailVerificationToken: { $exists: true, $ne: null }
        }).select('email emailVerificationToken emailVerificationExpires isEmailVerified');
        
        res.json({
            success: true,
            receivedToken: token,
            tokenLength: token.length,
            userFound: !!userWithToken,
            userDetails: userWithToken ? {
                email: userWithToken.email,
                tokenMatches: userWithToken.emailVerificationToken === token,
                storedToken: userWithToken.emailVerificationToken,
                storedTokenLength: userWithToken.emailVerificationToken.length,
                isExpired: userWithToken.emailVerificationExpires <= Date.now(),
                expiresAt: new Date(userWithToken.emailVerificationExpires).toISOString(),
                isVerified: userWithToken.isEmailVerified
            } : null,
            allTokens: allUsersWithTokens.map(u => ({
                email: u.email,
                token: u.emailVerificationToken,
                tokenLength: u.emailVerificationToken.length,
                isVerified: u.isEmailVerified
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
})
router.route("/login").post(loginUser)
router.route("/updateProfile").put(protect, updateUserProfile)
router.route("/profile").get(protect, getUserProfile)
router.route("/logout").get(protect, logoutUser)
router.route("/updatePassword").patch(protect, updatePassword)
router.route("/deleteAccount").delete(protect, deleteAccount)

export default router