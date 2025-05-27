import mongoose from "mongoose"


const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    product:{
type:mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
},{timestamps: true});

const Chat = mongoose.model("Chat", chatSchema)

export default Chat
