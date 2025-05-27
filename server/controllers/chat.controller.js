import Chat from "../models/chat.model.js";

export const getUserChat = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const userChats = await Chat.find({ participants: userId })
      .populate("participants", "fullName email")
      .populate("product", "title price images");
    return res.status(200).json({
      message: "User chats fetched successfully",
      chats: userChats,
    });
  } catch (error) {
    console.error("Error fetching user chat:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }
    const chat = await Chat.findById(chatId).populate("participants");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    return res.status(200).json({
      message: "Chat fetched successfully",
      chat,
    });
  } catch (error) {
    console.error("Error fetching chat by ID:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const createChatRoom = async (req, res) => {
  const { sellerId, winnerId, productId } = req.body;
  try {
    if (!sellerId || !winnerId || !productId) {
      return res
        .status(400)
        .json({ message: "Seller ID, Winner ID, and Product ID are required" });
    }
    let chatRoom = await Chat.findOne({
      participants: { $all: [sellerId, winnerId] },
      product: productId,
    });
    if (!chatRoom) {
      chatRoom = await Chat.create({
        participants: [sellerId, winnerId],
        messages: [],
        product: productId,
      });
      await chatRoom.save();
    }
    return res.status(201).json({
      message: "Chat room created successfully",
      chatRoom,
    });
  } catch (error) {
    console.error("Error creating chat room:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
