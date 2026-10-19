import Chat from "../models/chatModel.js";

export const getPublishedImages = async (req, res) => {
    try {
        const publishedImageMessages = await Chat.aggregate([
            { $unwind: "$messages" },
            {
                $match: {
                    "messages.isImage": true,
                    "messages.isPublished": true,
                },
            },
            {
                $project: {
                    _id: "$messages._id",
                    chatId: "$_id",
                    imageUrl: "$messages.content",
                    userName: "$userName",
                    timestamp: "$messages.timestamp",
                },
            },
            { $sort: { timestamp: -1 } },
            { $limit: 100 },
        ]);

        res.status(200).json({
            success: true,
            images: publishedImageMessages,
        });
    } catch (error) {
        console.error("Get Published Images Error:", error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch published images",
        });
    }
};
