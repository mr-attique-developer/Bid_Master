import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

const protect = async(req,res,next) =>{
    let token
    if(req.cookies){
        token = req.cookies.token
    }
    // console.log("middleware token ",token)
    if(!token){
        return res.status(401).json({
            success: false,
            message: "No Token No authorized to access this route",
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user  =  await User.findById(decoded.id).select("-password")
        if(!user){
            return res.status(401).json({
                success: false,
                message: "User Not  authorized to access this route",
            })
        }
 
        // console.log(decoded)
        req.user = user
        // console.log(req.user)
        next()
    } catch (error) {
        console.log(error.message)
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