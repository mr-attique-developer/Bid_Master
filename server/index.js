import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config.js";
import connectDB from "./config/db.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import bidRoutes from "./routes/bid.routes.js";
import { setSocketIO } from "./controllers/bid.controller.js";
import { setSocketIO as setProductSocketIO } from "./controllers/product.controller.js";
import { setSocketIOForCron } from "./crons/auctionChecker.js";
import bodyParser from "body-parser";
import "./crons/auctionChecker.js";
import http from "http";
import { Server } from "socket.io";
import Chat from "./models/chat.model.js"
import chatRoutes from "./routes/chat.routes.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// Export io for use in controllers
export { io };

// Set socket instance in controllers
setSocketIO(io);
setProductSocketIO(io);
setSocketIOForCron(io);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/bids", bidRoutes);
app.use("/api/v1/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ SOCKET.IO CONNECTION
io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  // ✅ Join auction room for bid notifications
  socket.on("joinAuction", ({ productId, userId }) => {
    const roomName = `auction-${productId}`;
    socket.join(roomName);
    console.log(`✅ User ${userId} joined auction room: ${roomName}`);
    console.log(`📊 Room ${roomName} now has ${io.sockets.adapter.rooms.get(roomName)?.size || 0} users`);
  });

  // ✅ Leave auction room
  socket.on("leaveAuction", ({ productId, userId }) => {
    const roomName = `auction-${productId}`;
    socket.leave(roomName);
    console.log(`❌ User ${userId} left auction room: ${roomName}`);
    console.log(`📊 Room ${roomName} now has ${io.sockets.adapter.rooms.get(roomName)?.size || 0} users`);
  });

  // ✅ Securely join chat room
  socket.on("joinRoom", async ({ roomId, userId }) => {
    try {
      const chat = await Chat.findById(roomId);
      if (!chat) return socket.emit("error", { message: "Chat not found" });

      const isParticipant = chat.participants.some(
        (id) => id.toString() === userId
      );
      if (!isParticipant)
        return socket.emit("error", { message: "Access denied" });

      socket.join(roomId);
      console.log(`✅ User ${userId} joined chat room ${roomId}`);
    } catch (err) {
      console.error("❌ joinRoom error:", err);
      socket.emit("error", { message: "Server error" });
    }
  });

  // ✅ Send message securely
  socket.on("sendMessage", async ({ roomId, senderId, text }) => {
    try {
      const chat = await Chat.findById(roomId);
      if (!chat) return socket.emit("error", { message: "Chat not found" });

      const isParticipant = chat.participants.some(
        (id) => id.toString() === senderId
      );
      if (!isParticipant)
        return socket.emit("error", { message: "Not allowed" });

      const message = { sender: senderId, text, timestamp: new Date() };
      chat.messages.push(message);
      await chat.save();

      io.to(roomId).emit("receiveMessage", message);
    } catch (error) {
      console.error("❌ sendMessage error:", error);
      socket.emit("error", { message: "Server error" });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected");
  });
});

// DB Connection
connectDB();

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
