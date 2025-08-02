import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config.js";
import connectDB from "./config/db.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import bidRoutes from "./routes/bid.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { setSocketIO } from "./controllers/bid.controller.js";
import { setSocketIO as setProductSocketIO } from "./controllers/product.controller.js";
import { setSocketIO as setChatSocketIO } from "./controllers/chat.controller.js";
import { setNotificationSocketIO } from "./utils/notifications.js";
import { setSocketIOForCron } from "./crons/auctionChecker.js";
import bodyParser from "body-parser";
import "./crons/auctionChecker.js";
import http from "http";
import { Server } from "socket.io";
import Chat from "./models/chat.model.js";
import Product from "./models/product.model.js";
import User from "./models/user.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Export io for use in controllers
// Set socket instance in controllers
setSocketIO(io);
setProductSocketIO(io);
setChatSocketIO(io);
setNotificationSocketIO(io);
setSocketIOForCron(io);

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/bid", bidRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/v1/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ SOCKET.IO CONNECTION
io.on("connection", (socket) => {
  console.log(`🟢 New client connected: ${socket.id}`);
  
  // Handle user joining their personal notification room
  socket.on("joinUserRoom", ({ userId }) => {
    try {
      const userRoom = `user-${userId}`;
      socket.join(userRoom);
      console.log(`👤 User ${userId} joined personal room: ${userRoom}`);
      
      socket.emit("joinedUserRoom", { 
        userRoom, 
        message: "Successfully joined notification room",
        socketId: socket.id
      });
    } catch (error) {
      console.error("❌ joinUserRoom error:", error);
      socket.emit("error", { message: "Error joining user room" });
    }
  });

  socket.on("joinRoom", async ({ roomId, userId }) => {
    try {
      if (roomId.startsWith('auction-chat-')) {
        const productId = roomId.replace('auction-chat-', '');
        
        // Validate ObjectId
        const mongoose = await import('mongoose');
        if (!mongoose.default.Types.ObjectId.isValid(productId)) {
          return socket.emit("error", { message: "Invalid product ID" });
        }

        const product = await Product.findById(productId).populate('seller winner');

        if (!product) {
          return socket.emit("error", { message: "Product not found" });
        }

        if (!product.winner || product.status !== 'closed') {
          return socket.emit("error", { message: "Auction not closed or has no winner" });
        }

        const isAuthorized = product.seller._id.toString() === userId || product.winner._id.toString() === userId;

        if (!isAuthorized) {
          return socket.emit("error", { message: "Access denied - not auction participant" });
        }

        socket.join(roomId);
        
        // Send confirmation to user
        socket.emit("joinedRoom", { 
          roomId, 
          message: "Successfully joined auction chat",
          product: {
            title: product.title,
            seller: product.seller.fullName,
            winner: product.winner.fullName
          }
        });
        return;
      }

      // Regular chat room logic
      const chat = await Chat.findById(roomId);
      if (!chat) {
        return socket.emit("error", { message: "Chat not found" });
      }

      const isParticipant = chat.participants.some(id => id.toString() === userId);
      if (!isParticipant) {
        return socket.emit("error", { message: "Access denied - not a participant" });
      }

      socket.join(roomId);
      socket.emit("joinedRoom", { roomId, message: "Successfully joined chat" });
      
    } catch (err) {
      console.error("❌ joinRoom error:", err);
      socket.emit("error", { message: "Server error while joining room" });
    }
  });

  socket.on("sendMessage", async ({ roomId, senderId, text }) => {
    try {
      if (!text || text.trim() === '') {
        return socket.emit("error", { message: "Message cannot be empty" });
      }

      if (roomId.startsWith('auction-chat-')) {
        const productId = roomId.replace('auction-chat-', '');
        
        // Validate ObjectId
        const mongoose = await import('mongoose');
        if (!mongoose.default.Types.ObjectId.isValid(productId)) {
          return socket.emit("error", { message: "Invalid product ID" });
        }

        const product = await Product.findById(productId);

        if (!product || !product.winner || product.status !== 'closed') {
          return socket.emit("error", { message: "Product not found, no winner, or auction not closed" });
        }

        const isAuthorized = product.seller.toString() === senderId || product.winner.toString() === senderId;
        if (!isAuthorized) {
          return socket.emit("error", { message: "Access denied - not auction participant" });
        }

        // Find or create chat
        let chat = await Chat.findOne({
          product: productId,
          seller: product.seller,
          winner: product.winner
        });

        if (!chat) {
          chat = new Chat({
            product: productId,
            seller: product.seller,
            winner: product.winner,
            participants: [product.seller, product.winner],
            messages: []
          });
        }

        // Create message object
        const message = {
          sender: senderId,
          text: text.trim(),
          timestamp: new Date()
        };

        // Add message to chat
        chat.messages.push(message);
        await chat.save();

        // Get sender details for populated response
        const sender = await User.findById(senderId, 'fullName email');

        const populatedMessage = {
          _id: chat.messages[chat.messages.length - 1]._id, // Get the ID of the newly added message
          sender: {
            _id: sender._id,
            fullName: sender.fullName,
            email: sender.email
          },
          text: text.trim(),
          timestamp: message.timestamp
        };

        // Emit to all users in the room with complete data
        const messageData = {
          _id: populatedMessage._id,
          sender: populatedMessage.sender,
          senderId: senderId,
          senderName: sender.fullName,
          text: populatedMessage.text,
          timestamp: populatedMessage.timestamp,
          productId: productId,
          productTitle: product.title,
          message: populatedMessage // Include the full message object for compatibility
        };
        
        console.log('📡 Emitting newChatMessage to room:', roomId, messageData);
        io.to(roomId).emit("newChatMessage", messageData);
        
        // Also emit to individual user notification rooms
        const recipientId = senderId === product.seller.toString() ? product.winner.toString() : product.seller.toString();
        console.log('📡 Emitting chatNotification to user:', recipientId);
        io.to(`user-${recipientId}`).emit("chatNotification", {
          userId: recipientId,
          senderId: senderId,
          senderName: sender.fullName,
          productId: productId,
          productTitle: product.title,
          messagePreview: text.length > 50 ? text.substring(0, 50) + "..." : text
        });
        
        // Confirm to sender
        socket.emit("messageSent", { 
          success: true, 
          message: populatedMessage,
          roomId 
        });

        return;
      }

      // Regular chat logic
      const chat = await Chat.findById(roomId);
      if (!chat) {
        return socket.emit("error", { message: "Chat not found" });
      }

      const isParticipant = chat.participants.some(id => id.toString() === senderId);
      if (!isParticipant) {
        return socket.emit("error", { message: "Access denied - not a participant" });
      }

      // Add message to regular chat
      const message = {
        sender: senderId,
        text: text.trim(),
        timestamp: new Date()
      };

      chat.messages.push(message);
      await chat.save();

      const sender = await User.findById(senderId, 'fullName email');
      const populatedMessage = {
        _id: chat.messages[chat.messages.length - 1]._id,
        sender: {
          _id: sender._id,
          fullName: sender.fullName,
          email: sender.email
        },
        text: text.trim(),
        timestamp: message.timestamp
      };

      // Emit with complete data
      const messageData = {
        _id: populatedMessage._id,
        sender: populatedMessage.sender,
        senderId: senderId,
        senderName: sender.fullName,
        text: populatedMessage.text,
        timestamp: populatedMessage.timestamp,
        message: populatedMessage // Include the full message object for compatibility
      };

      console.log('📡 Emitting newChatMessage to regular chat room:', roomId, messageData);
      io.to(roomId).emit("newChatMessage", messageData);
      socket.emit("messageSent", { 
        success: true, 
        message: populatedMessage,
        roomId 
      });

    } catch (error) {
      console.error("❌ sendMessage error:", error);
      socket.emit("error", { 
        message: "Server error while sending message",
        details: error.message 
      });
    }
  });

  // ✅ NEW: Handle typing indicators
  socket.on("typing", ({ roomId, userId, isTyping }) => {
    socket.to(roomId).emit("userTyping", { userId, isTyping });
  });

  // ✅ NEW: Handle user leaving room
  socket.on("leaveRoom", ({ roomId, userId }) => {
    socket.leave(roomId);
    socket.emit("leftRoom", { roomId });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
  });
});
// DB Connection
connectDB();

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
