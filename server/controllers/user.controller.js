import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import sendEmail from "../utils/email.js"


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
            password,
            fullName,
            password: hashedPassword,
        })
        res.status(201).json({
            success: true,
            message: "User registered successfully",    
            user: newUser,
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
    const {userId, businessName, businessDescription, location, role} = req.body
    const phone = req.body.phone.replace(/\D/g, '');
    if(!phone || !businessName || !businessDescription || !location || !role){
        return res.status(400).json({
            success: false,
            message: "Please fill all the fields,,,, ",
        })
        
    }
    const phoneRegex = /^0[3][0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid 11-digit Pakistani phone number (e.g., 0300 1234567)",
        });
    }
if(phone.length < 11 || phone.length > 11){
    return res.status(400).json({
        success: false,
        message: "Phone number must be 11 digits long",
    })
}

if(role !== "buyer" && role !== "seller" && role !== "admin"){
    return res.status(400).json({
        success: false,
        message: "Role must be either buyer, seller or admin",
    })
}
const user = await User.findByIdAndUpdate(userId, {
    phone,
    businessName,
    businessDescription,
    location,
    role,
    isActive:true
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