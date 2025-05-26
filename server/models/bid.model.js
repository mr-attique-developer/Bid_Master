import mongoose from "mongoose"


const bidSchema = mongoose.Schema({
product :{
    type : mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
},
bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
},
amount: {
    type: Number,
    required: true,
    min: [0, "Bid amount cannot be negative"]
},
},
{ timestamps: true }
)


const Bid = mongoose.model("Bid", bidSchema)


export default Bid;