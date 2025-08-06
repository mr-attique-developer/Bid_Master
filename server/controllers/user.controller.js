import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import sendEmail from "../utils/email.js"
import jwt from "jsonwebtoken"
import crypto from "crypto"


const generateToken = (id)=>{
return jwt.sign({id}, process.env.JWT_SECRET,{expiresIn: process.env.JWT_EXPIRES_IN})
}

export const registerUser1 = async(req, res) =>{
    try {
        const {email, password, fullName, confirmPassword} = req.body
      

        if(!email || !password || !fullName || !confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            })
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            })
        }
        if(password.length < 8){
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
            })
        }
        if(password !== confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Password and confirm password do not match",
            })
        }
        const user = await User.findOne({email})
        if(user){
            return res.status(400).json({
                success: false,
                message: "User already exists",
            })
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number",
            })
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        
        // Generate email verification token - using URL-safe base64
        const randomBytes = crypto.randomBytes(32);
        const emailVerificationToken = randomBytes.toString('base64url'); // URL-safe base64
        const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        
        console.log('=== REGISTRATION DEBUG ===');
        console.log('Generated token:', emailVerificationToken);
        console.log('Token length:', emailVerificationToken.length);
        console.log('Token expires at:', emailVerificationExpires);
        console.log('Token expires date:', new Date(emailVerificationExpires).toISOString());
        console.log('Current time:', Date.now());
        console.log('Current date:', new Date().toISOString());
        console.log('Raw bytes:', randomBytes.toString('hex'));
        
        const newUser = await User.create({
            email,
            fullName,
            password: hashedPassword,
            emailVerificationToken,
            emailVerificationExpires,
        })
        
        // Send verification email
        const verificationURL = `${process.env.CLIENT_URL}/verify-email/${emailVerificationToken}`;
        console.log('Verification URL:', verificationURL);
        console.log('Full URL length:', verificationURL.length);
        
        const emailSubject = "Email Verification - Bid Master";
        const emailMessage = `
Hello ${fullName},

Welcome to Bid Master! Please verify your email address by clicking the link below:

${verificationURL}

This link will expire in 24 hours.

If you didn't create an account with us, please ignore this email.

Best regards,
Bid Master Team

--- 
Debug Information:
Token: ${emailVerificationToken}
Token Length: ${emailVerificationToken.length}
Generated At: ${new Date().toISOString()}

If the link above doesn't work, copy and paste this URL into your browser:
${verificationURL}

Alternative debug URL (copy this to browser to check token):
${process.env.CLIENT_URL}/api/v1/user/debug-token/${emailVerificationToken}
        `;
        
        try {
            await sendEmail(newUser.email, emailSubject, emailMessage);
        } catch (emailError) {
            // If email fails, delete the user and return error
            await User.findByIdAndDelete(newUser._id);
            return res.status(500).json({
                success: false,
                message: "Failed to send verification email. Please try again.",
            });
        }
        
        res.status(201).json({
            success: true,
            message: "Registration successful! Please check your email to verify your account.",    
            user: {
                _id: newUser._id,
                email: newUser.email,
                fullName: newUser.fullName,
                isEmailVerified: newUser.isEmailVerified,
                isActive: newUser.isActive
            },
            isActive: false
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in registering user1",
        })
        
    }
}


export const registerUser2 = async(req,res)=>{
try {
    const userId = req.user._id
    const { businessName, businessDescription, location, role,phone} = req.body
    
    // Check if user's email is verified
    const currentUser = await User.findById(userId);
    if (!currentUser.isEmailVerified) {
        return res.status(400).json({
            success: false,
            message: "Please verify your email before completing registration.",
        });
    }
    
 if (role === "buyer") {
    if (!phone || !location || !role) {
        return res.status(400).json({
            success: false,
            message: "Please fill all the fields.",
        });
    }
} else {
    if (!phone || !businessName || !businessDescription || !location || !role) {
        return res.status(400).json({
            success: false,
            message: "Please fill all the fields.",
        });
    }
}
    const cleanPhoneDigit =  phone.replace(/\D/g, '');
    const phoneRegex = /^(0[3][0-9]{9}|92[3][0-9]{9})$/;
    if (!phoneRegex.test(cleanPhoneDigit)) {
        return res.status(400).json({
            success: false,
            message: "Invalid Pakistani number. Use 0300 1234567 or 92 300 1234567",
        });
    }
    const formatedPhone = cleanPhoneDigit.startsWith("92") ? "0" + cleanPhoneDigit.substring(2) : cleanPhoneDigit
if(role !== "buyer" && role !== "seller" && role !== "both"){
    return res.status(400).json({
        success: false,
        message: "Role must be either buyer, seller or both seller and buyer",
    })
}

const user = await User.findByIdAndUpdate(userId, {
    phone : formatedPhone,
    businessName,
    businessDescription,
    location,
    role,
    isActive:true,
    taxId: Math.floor(100000 + Math.random() * 900000).toString(), // Generate a random 6-digit tax ID
}
, {new: true})
if(!user){
    return res.status(400).json({
        success: false,
        message: "User not found",
    })
}

await sendEmail(
    user.email,
    "Welcome to Bid Master",
    `Hello ${user.fullName},\n\nWelcome to Bid Master! We are excited to have you on board.\n\nBest regards,\nBid Master Team`
)
res.status(200).json({
    success: true,
    message: "User registered successfully",
    user,
})  

} catch (error) {
    res.status(500).json({
        success: false,
        message: "Error in registering user",
    })
}
}

// Email verification function
export const verifyEmail = async (req, res) => {
    try {
        let { token } = req.params;
        console.log('=== EMAIL VERIFICATION DEBUG ===');
        console.log('Received token:', token);
        console.log('Token length:', token.length);
        console.log('Token type:', typeof token);
        console.log('Current timestamp:', Date.now());
        console.log('Current date:', new Date().toISOString());
        
        // Decode the token if it's URL encoded
        token = decodeURIComponent(token);
        console.log('Decoded token:', token);
        console.log('Decoded token length:', token.length);
        
        // Find user with the verification token and check if it's not expired
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });
        
        // Also check if user exists with this token but expired
        const expiredUser = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $lte: Date.now() }
        });
        
        // Check if there's any user with this token (regardless of expiry)
        const anyUserWithToken = await User.findOne({
            emailVerificationToken: token
        });
        
        // If no user found with token, check if there might be a user who was already verified
        // by checking recent users without tokens (tokens are cleared after verification)
        let possibleVerifiedUser = null;
        if (!anyUserWithToken) {
            // Look for recently verified users without tokens
            possibleVerifiedUser = await User.findOne({
                isEmailVerified: true,
                emailVerificationToken: { $exists: false },
                updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // within last 24 hours
            }).sort({ updatedAt: -1 }); // get the most recent one
        }
        
        console.log('Active user found:', user ? 'Yes' : 'No');
        console.log('Expired user found:', expiredUser ? 'Yes' : 'No');
        console.log('Any user with token found:', anyUserWithToken ? 'Yes' : 'No');
        console.log('Possible verified user found:', possibleVerifiedUser ? 'Yes' : 'No');
        
        // Debug: Check if token exists in any form
        const allUsersWithTokens = await User.find({
            emailVerificationToken: { $exists: true, $ne: null }
        }).select('email emailVerificationToken emailVerificationExpires isEmailVerified');
        
        console.log('All users with tokens:', allUsersWithTokens.length);
        allUsersWithTokens.forEach((u, index) => {
            console.log(`User ${index + 1}:`);
            console.log('- Email:', u.email);
            console.log('- Token:', u.emailVerificationToken);
            console.log('- Token length:', u.emailVerificationToken.length);
            console.log('- Token matches received?', u.emailVerificationToken === token);
            console.log('- Expires at:', new Date(u.emailVerificationExpires).toISOString());
            console.log('- Is expired?', u.emailVerificationExpires <= Date.now());
            console.log('- Already verified?', u.isEmailVerified);
        });
        
        if (anyUserWithToken) {
            console.log('User details:');
            console.log('- Email:', anyUserWithToken.email);
            console.log('- Token in DB:', anyUserWithToken.emailVerificationToken);
            console.log('- Token expires at:', anyUserWithToken.emailVerificationExpires);
            console.log('- Token expired?', anyUserWithToken.emailVerificationExpires <= Date.now());
            console.log('- Already verified?', anyUserWithToken.isEmailVerified);
        }
        
        // Check if user is already verified
        if (anyUserWithToken && anyUserWithToken.isEmailVerified) {
            console.log('User email is already verified (with token)');
            
            // Generate JWT token for authenticated session
            const jwtToken = generateToken(anyUserWithToken._id);
            res.cookie("token", jwtToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            
            return res.status(200).json({
                success: true,
                message: "Email is already verified. You can proceed to complete your registration.",
                user: {
                    _id: anyUserWithToken._id,
                    email: anyUserWithToken.email,
                    fullName: anyUserWithToken.fullName,
                    isEmailVerified: anyUserWithToken.isEmailVerified,
                    isActive: anyUserWithToken.isActive
                },
                token: jwtToken
            });
        }
        
        // If no user found with token, but we found a recently verified user, assume it's the same verification
        if (!anyUserWithToken && possibleVerifiedUser) {
            console.log('Found recently verified user, assuming same verification process');
            
            // Generate JWT token for authenticated session
            const jwtToken = generateToken(possibleVerifiedUser._id);
            res.cookie("token", jwtToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            
            return res.status(200).json({
                success: true,
                message: "Email verification completed successfully! You can now complete your registration.",
                user: {
                    _id: possibleVerifiedUser._id,
                    email: possibleVerifiedUser.email,
                    fullName: possibleVerifiedUser.fullName,
                    isEmailVerified: possibleVerifiedUser.isEmailVerified,
                    isActive: possibleVerifiedUser.isActive
                },
                token: jwtToken
            });
        }
        
        if (!user) {
            if (expiredUser) {
                console.log('Token has expired');
                return res.status(400).json({
                    success: false,
                    message: "Verification token has expired. Please request a new verification email.",
                });
            }
            
            // Check if any user exists with a similar email but is already verified
            if (anyUserWithToken && anyUserWithToken.isEmailVerified) {
                console.log('User email is already verified, returning success');
                
                // Generate JWT token for authenticated session
                const jwtToken = generateToken(anyUserWithToken._id);
                res.cookie("token", jwtToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                });
                
                return res.status(200).json({
                    success: true,
                    message: "Email verification completed. Proceeding to registration step 2.",
                    user: {
                        _id: anyUserWithToken._id,
                        email: anyUserWithToken.email,
                        fullName: anyUserWithToken.fullName,
                        isEmailVerified: anyUserWithToken.isEmailVerified,
                        isActive: anyUserWithToken.isActive
                    },
                    token: jwtToken
                });
            }
            
            console.log('Invalid or non-existent token');
            return res.status(400).json({
                success: false,
                message: "Invalid verification token. Please check your email or request a new verification email.",
            });
        }
        
        // Mark email as verified and clear verification fields
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        
        // Generate JWT token for authenticated session
        const jwtToken = generateToken(user._id);
        res.cookie("token", jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        
        res.status(200).json({
            success: true,
            message: "Email verified successfully! You can now complete your registration.",
            user: {
                _id: user._id,
                email: user.email,
                fullName: user.fullName,
                isEmailVerified: user.isEmailVerified,
                isActive: user.isActive
            },
            token: jwtToken
        });
        
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: "Error in email verification",
        });
    }
};

// Resend verification email
export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified",
            });
        }
        
        // Generate new verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        
        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationExpires = emailVerificationExpires;
        await user.save();
        
        // Send verification email
        const verificationURL = `${process.env.CLIENT_URL}/verify-email/${emailVerificationToken}`;
        const emailSubject = "Email Verification - Bid Master";
        const emailMessage = `
            Hello ${user.fullName},
            
            Please verify your email address by clicking the link below:
            
            ${verificationURL}
            
            This link will expire in 24 hours.
            
            Best regards,
            Bid Master Team
        `;
        
        await sendEmail(user.email, emailSubject, emailMessage);
        
        res.status(200).json({
            success: true,
            message: "Verification email sent successfully",
        });
        
    } catch (error) {
        console.error('Resend verification email error:', error);
        res.status(500).json({
            success: false,
            message: "Error sending verification email",
        });
    }
};


export const loginUser = async(req,res)=>{
    try {
        const {email, password} = req.body
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            })
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            })
        }
        const user = await User.findOne({email})
        if(!user){
            return res.status(400).json({
                success: false,
                message: "User not found",
            })
        }
        
        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "Please verify your email before logging in. Check your email for verification link.",
                needsEmailVerification: true
            })
        }
        
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            })
        }
        const token = generateToken(user._id)
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // only secure in production
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
          });
        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token,
            user:{
                id:user._id,
                email:user.email,
                fullName:user.fullName,
                phone:user.phone,
                businessName:user.businessName,
                businessDescription:user.businessDescription,
                location:user.location,
                role:user.role,
                isActive:user.isActive
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in logging in user",
        })
        
    }
}

export const logoutUser = async(req,res)=>{
    try {
        
        res.cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" ? true : false,
            sameSite: "strict"
        })
        res.status(200).json({
            success: true,
            message: "User logged out successfully",
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in logging out user",
        })
        
    }
}

export const getUserProfile = async(req,res) =>{
    try {
        const userId  = req.user._id
        
        const user = await User.findById(userId).select("-password")
        if(!user){
            return res.status(400).json({
                success: false,
                message: "User not found",
            })
        }
        res.status(200).json({
            success: true,
            message: "User profile fetched successfully",
            user,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in getting user profile",
        })
        
    }
}

export const updateUserProfile = async(req,res) =>{
    try {
        const userId = req.user._id
        const {email, fullName, phone,location, bio} = req.body
        if(!email || !fullName || !phone || !location || !bio ){
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            })
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            })
        }
        const phoneRegex = /^0[3][0-9]{9}|92[3][0-9]{9}$/;
        const cleanPhoneDigit =  phone.replace(/\D/g, '');
        if( !phoneRegex.test(cleanPhoneDigit)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid 11-digit Pakistani phone number (e.g., 0300 1234567)",
            });
        }
        const formatedPhone = cleanPhoneDigit.startsWith("92") ? "0" + cleanPhoneDigit.substring(2) : cleanPhoneDigit
    
        const user = await User.findById(userId)
        if(!user){
            return res.status(400).json({
                success: false,
                message: "User not found",
            })
        }
        const updatedUser = await User.findByIdAndUpdate(userId, {
            email,
            fullName,
            phone : formatedPhone,
            location,
            bio
        }, {new: true, select: "-password"})
        if(!updatedUser){
            return res.status(400).json({
                success: false,
                message: "Error in updating user profile",
            })
        }
        res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            user: updatedUser,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in updating user profile",
        })
        
    }
}

export const updatePassword = async(req,res)=>{
    try {
        const userId = req.user._id
        const {oldPassword, newPassword, confirmPassword} = req.body
        if(!oldPassword || !newPassword || !confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            })
        }
        const user = await User.findById(userId)
        if(!user){
            return res.status(400).json({
                success: false,
                message: "User not found",
            })
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password)
        if(!isMatch){
            return res.status(400).json({
                success: false,
                message: "Old password is incorrect",
            })
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        if(!passwordRegex.test(newPassword)){
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number",
            })
        }
        if(newPassword !== confirmPassword){
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match",
            })
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt)
        const updatedUser = await User.findByIdAndUpdate(userId, {
            password: hashedPassword,
            passwordChangedAt: Date.now()
        }, {new: true, select: "-password"})   
        if(!updatedUser){
            return res.status(400).json({
                success: false,
                message: "Error in updating password",
            })
        }
        const token = generateToken(updatedUser._id)
        res.status(200).json({
            success: true,
            message: "Password updated successfully",
            user: updatedUser,
            token
        }) 
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in updating password",
        })
        
    }
}


export const deleteAccount = async(req,res)=>{
    try {
        const userId = req.user._id
        const deletedUser = await User.findByIdAndDelete(userId)
        if(!deletedUser){
            res.status(400).json({
                success: false,
                message: "User Not Found",
        })
    }
    res.clearCookie("token")
    res.status(200).json({
        sucess: true,
        message:"User Deleted Successfully"
    })

        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in deleting account",
        })
        
    }
}
