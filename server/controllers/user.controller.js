import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import sendEmail from "../utils/email.js"
import jwt from "jsonwebtoken"


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
        const newUser = await User.create({
            email,
            fullName,
            password: hashedPassword,
        })
        const token=  generateToken(newUser._id)
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // only secure in production
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
          }); 
        res.status(201).json({
            success: true,
            message: "User registered successfully",    
            user: newUser,
            token,
            isActive:false
        })

    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            success: false,
            message: "Error in registering user1",
        })
        
    }
}


export const registerUser2 = async(req,res)=>{
try {
    const userId = req.user._id
    console.log(userId)
    const { businessName, businessDescription, location, role,phone} = req.body
    if(!phone || !businessName || !businessDescription || !location || !role){
        return res.status(400).json({
            success: false,
            message: "Please fill all the fields,,,, ",
        })
        
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
    console.log(error.message)
}
}



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
        console.log("The Error in login controller ",error.message)
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
        console.log(error.message)
        res.status(500).json({
            success: false,
            message: "Error in logging out user",
        })
        
    }
}

export const getUserProfile = async(req,res) =>{
    try {
        const userId  = req.user._id
        
        // console.log(userId)
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
        console.log(error.message)
        res.status(500).json({
            success: false,
            message: "Error in getting user profile",
        })
        
    }
}

export const updateUserProfile = async(req,res) =>{
    try {
        const userId = req.user._id
        const {email, fullName, phone, businessName, businessDescription, location, bio, role} = req.body
        if(!email || !fullName || !phone || !businessName || !businessDescription || !location || !bio || !role){
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
            businessName,
            businessDescription,
            location,
            bio,
            role
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
        console.log(error.message)
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
        console.log(error.message)
        res.status(500).json({
            success: false,
            message: "Error in updating password",
        })
        
    }
}


export const deleteAccount = async(req,res)=>{
    try {
        const userId = req.user._id
        console.log(userId)
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
        console.log(error.message)
        res.status(500).json({
            success: false,
            message: "Error in deleting account",
        })
        
    }
}
