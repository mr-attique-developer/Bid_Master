import mongoose from "mongoose"

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // ✅ Made required for auction chats
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // ✅ Made required for auction chats
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: { // ✅ Using 'text' consistently
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    // ✅ Add indexes for better performance
}, { 
    timestamps: true,
    // ✅ Add compound indexes for efficient queries
    indexes: [
        { product: 1, seller: 1, winner: 1 }, // For auction chat queries
        { participants: 1 }, // For general chat queries
        { updatedAt: -1 } // For sorting by recent activity
    ]
});

// ✅ Add a pre-save middleware to ensure participants array is set correctly
chatSchema.pre('save', function(next) {
    if (this.seller && this.winner && (!this.participants || this.participants.length === 0)) {
        this.participants = [this.seller, this.winner];
    }
    next();
});

const Chat = mongoose.model("Chat", chatSchema)

export default Chat;