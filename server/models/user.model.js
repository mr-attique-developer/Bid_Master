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
        trim: true
    },
    confirmPassword:{
       type: String,
       trim: true,
        minLength: [8 , "Password must be at least 8 characters"],
    },
    passwordChangedAt:{
        type: Date,


    },
    bio:{
        type: String,
        default: "Hello, I am using this app",
    },
    role:{
        type: String,
        enum: ["buyer" , "seller" , "both"],
        default: "buyer",
    },
    phone: {
        type: String
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
  
},{timestamps: true})




const User = mongoose.model("User", userSchema)

export default User