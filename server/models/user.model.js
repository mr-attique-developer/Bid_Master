import mongoose from "mongoose"

const userSchema = mongoose.Schema({
    fullName:{
        type: String,
        required: [true , "Please enter your full name"],

    },
    email:{
        type: String,
        required: [true , "Please enter your email"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password:{
        type: String,
        required: [true , "Please enter your password"],
        minLength: [8 , "Password must be at least 8 characters"],
    },
    confirmPassword:{
       type: String,
        minLength: [8 , "Password must be at least 8 characters"],
    },
    role:{
        type: String,
        enum: ["buyer" , "seller" , "admin"],
        default: "buyer",
    },
    phone:{
        type: String,
        unique: true,
    },
    
    location:{
        type: String,
    },
    businessName:{
        type: String,
    },
    businessDescription:{
        type: String,
       
    },
    taxId:{
        type: String,
    },
    isActive:{
        type: Boolean,
        default: false,
    },
    isVerified:{
        type: Boolean,
        default: false,
    },
},{timestamps: true})




const User = mongoose.model("User", userSchema)

export default User