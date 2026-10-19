import imagekit from "../config/imageKit.js";
import { ai } from "../config/gemini.js";
import { askAi } from "../services/openRouter.service.js";
import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";
import axios from "axios";

export const textMessageController = async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;
        const { chatId, prompt } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ success: false, message: "Prompt is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }


        const chat = await Chat.findOne({ userId, _id: chatId });
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        chat.messages.push({
            role: "user",
            content: prompt,
            timestamp: new Date(),
            isImage: false,
        });

        if (chat.name === "New Chat" || !chat.name) {
            chat.name = prompt.slice(0, 35);
        }

        const lowerPrompt = prompt.toLowerCase().trim();
        const isCreatorQuestion =
            /(who\s+(created|made|built|developed|designed|coded)\s+you|who\s+is\s+your\s+(creator|developer|maker|owner|author|team|leader)|who\s+are\s+your\s+(creators|developers)|tell\s+me\s+who\s+created\s+you|who\s+is\s+(the\s+)?(creator|developer)\s+of\s+(this\s+)?(ai|copilot|bot|app))/i.test(
                lowerPrompt
            );

        const isGreeting =
            /^(hi|hello|hey|namaste|helo|hlo|greetings|good\s+(morning|afternoon|evening))(\s+(copilot|skillsetu|skillsetucopilot|sankhya|ai|there|bot))?[!.?\s]*$/i.test(
                lowerPrompt
            );

        const displayName = user.name || "there";

        const systemPrompt = `You are SkillSetu Copilot, the dedicated and intelligent AI Copilot for the SkillSetu AI Platform.
Rules:
- If the user greets you (e.g. "hi", "hello", "hey"), greet them warmly: "Hi ${displayName}, I am SkillSetu Copilot. How can I help you today?"
- If the user asks who created you, who made you, who is your developer, team, or creator, reply clearly: "I was created by Team ZYPHOR, led by Team Leader Srijan Murmu and Lead Developer Suvojit Manna."
- Do not mention Google, Gemini, OpenAI, or any competing company branding.
- Answer clearly, helpfully, and with formatted Markdown when presenting code, lists, or structured data.`;

        let replyText = "";

        if (isGreeting) {
            replyText = `Hi ${displayName}, I am SkillSetu Copilot. How can I help you today?`;
        } else if (isCreatorQuestion) {
            replyText = "I was created by **Team ZYPHOR**, led by Team Leader **Srijan Murmu** and Lead Developer **Suvojit Manna**.";
        } else if (ai) {
            try {
                const response = await ai.models.generateContent({
                    model: "gemini-3.6-flash",
                    contents: `${systemPrompt}\n\nUser: ${prompt}`,
                });
                replyText = response?.text || "";
            } catch (geminiError) {
                console.warn("Gemini call error, attempting OpenRouter fallback:", geminiError.message);
            }
        }

        if (!replyText) {
            try {
                const messages = [
                    { role: "system", content: systemPrompt },
                    ...chat.messages.slice(-6).map((m) => ({
                        role: m.role === "assistant" ? "assistant" : "user",
                        content: m.content,
                    })),
                ];
                replyText = await askAi(messages);
            } catch (fallbackError) {
                console.error("OpenRouter fallback error:", fallbackError.message);
                throw new Error("AI generation failed. Please try again.");
            }
        }

        const reply = {
            role: "assistant",
            content: replyText,
            timestamp: new Date(),
            isImage: false,
        };

        chat.messages.push(reply);
        await chat.save();


        res.status(200).json({
            success: true,
            reply,
            creditsLeft: user.credits,
        });
    } catch (error) {
        console.error("Text Message Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const imageMessageController = async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;
        const { prompt, chatId, isPublished = false } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ success: false, message: "Prompt is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }


        const chat = await Chat.findOne({ userId, _id: chatId });
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        chat.messages.push({
            role: "user",
            content: prompt,
            timestamp: new Date(),
            isImage: false,
        });

        let imageUrl = "";

        if (process.env.CLIPDROP_API_KEY) {
            try {
                const clipdropResponse = await axios.post(
                    "https://clipdrop-api.co/text-to-image/v1",
                    { prompt },
                    {
                        headers: { "x-api-key": process.env.CLIPDROP_API_KEY },
                        responseType: "arraybuffer",
                    }
                );

                const base64Image = `data:image/png;base64,${Buffer.from(clipdropResponse.data).toString("base64")}`;

                if (imagekit) {
                    const uploadResponse = await imagekit.upload({
                        file: base64Image,
                        fileName: `ai_img_${Date.now()}.png`,
                        folder: "ai_interviews_chat",
                    });
                    imageUrl = uploadResponse.url;
                } else {
                    imageUrl = base64Image;
                }
            } catch (clipErr) {
                console.warn("ClipDrop image gen error:", clipErr.message);
            }
        }

        if (!imageUrl) {
            const seed = Math.floor(Math.random() * 1000000);
            const encodedPrompt = encodeURIComponent(prompt);
            const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

            if (imagekit) {
                try {
                    const uploadResponse = await imagekit.upload({
                        file: fallbackUrl,
                        fileName: `ai_img_${Date.now()}.jpg`,
                        folder: "ai_interviews_chat",
                    });
                    imageUrl = uploadResponse.url;
                } catch {
                    imageUrl = fallbackUrl;
                }
            } else {
                imageUrl = fallbackUrl;
            }
        }

        const reply = {
            role: "assistant",
            content: imageUrl,
            timestamp: new Date(),
            isImage: true,
            isPublished: Boolean(isPublished),
        };

        chat.messages.push(reply);
        await chat.save();

        res.status(200).json({
            success: true,
            reply,
            creditsLeft: user.credits,
        });
    } catch (error) {
        console.error("Image Generation Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate image",
        });
    }
};

export const publishImageController = async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;
        const { chatId, messageId, isPublished = true } = req.body;

        const chat = await Chat.findOne({ _id: chatId, userId });
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        const message = chat.messages.id(messageId) || chat.messages.find(m => m._id.toString() === messageId || m.content === messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        message.isPublished = Boolean(isPublished);
        await chat.save();

        res.status(200).json({
            success: true,
            message: isPublished ? "Image published to community gallery" : "Image removed from community gallery",
        });
    } catch (error) {
        console.error("Publish Image Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
