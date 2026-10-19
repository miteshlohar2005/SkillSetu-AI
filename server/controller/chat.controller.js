import Chat from "../models/chatModel.js";

export const createChat = async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;
        const userName = req.user?.name || "User";

        const chat = await Chat.create({
            userId,
            userName,
            name: "New Chat",
            messages: [],
        });

        res.status(201).json({
            success: true,
            chat,
        });
    } catch (error) {
        console.error("Create Chat Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to create chat",
        });
    }
};

export const getChats = async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;

        const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            chats,
        });
    } catch (error) {
        console.error("Get Chats Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch chats",
        });
    }
};

export const getChatById = async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;
        const { id } = req.params;

        const chat = await Chat.findOne({ _id: id, userId });
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found",
            });
        }

        res.status(200).json({
            success: true,
            chat,
        });
    } catch (error) {
        console.error("Get Chat By Id Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch chat",
        });
    }
};

export const deleteChat = async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;
        const chatId = req.body.chatId || req.params.id;

        if (!chatId) {
            return res.status(400).json({
                success: false,
                message: "Chat ID is required",
            });
        }

        await Chat.deleteOne({ _id: chatId, userId });

        res.status(200).json({
            success: true,
            message: "Chat deleted successfully",
        });
    } catch (error) {
        console.error("Delete Chat Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete chat",
        });
    }
};
