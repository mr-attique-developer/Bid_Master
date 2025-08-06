import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

const protect = async(req,res,next) =>{
    let token
    
    // First try to get token from cookies
    if(req.cookies && req.cookies.token){
        token = req.cookies.token
    }
    // If no cookie token, try Authorization header
    else if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        token = req.headers.authorization.split(' ')[1]
    }
    
    if(!token){
        return res.status(401).json({
            success: false,
            message: "No Token, not authorized to access this route",
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user  =  await User.findById(decoded.id).select("-password")
        if(!user){
            return res.status(401).json({
                success: false,
                message: "User not authorized to access this route",
            })
        }

        req.user = user
        next()
    } catch (error) {
        console.error('Auth middleware error:', error.message)
        return res.status(401).json({
            success: false,
            message: "Not authorized to access this route",
        })
    }
}



// admin middleware 
export const checkRole = (requireRole)=>{
    return (req,res, next) =>{
        if(!req.user.role.includes(requireRole)){
            return res.status(403).json({
                success: false,
                message: `You are not authorized to access this route only ${requireRole} role allowed`,
            })
        }
        next()
    }
} 

export default protect