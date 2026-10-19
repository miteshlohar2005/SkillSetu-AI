import axios from "axios";
import { ai } from "../config/gemini.js";

export const askAi = async (messages) => {
    try {
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            throw new Error("Messages array is empty.");
        }

        if (process.env.OPENROUTER_API_KEY) {
            try {
                const response = await axios.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {
                        model: "openai/gpt-4o-mini",
                        messages: messages,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                            "Content-Type": "application/json",
                        },
                        timeout: 25000,
                    }
                );

                const content = response?.data?.choices?.[0]?.message?.content;
                if (content && content.trim()) {
                    return content;
                }
            } catch (openRouterErr) {
                console.warn("[OPENROUTER WARN] Attempting Gemini fallback:", openRouterErr.message);
            }
        }

        if (ai) {
            try {
                const systemMsg = messages.find((m) => m.role === "system")?.content || "";
                const userPrompt = messages
                    .filter((m) => m.role !== "system")
                    .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
                    .join("\n\n");

                const fullContent = systemMsg ? `${systemMsg}\n\n${userPrompt}` : userPrompt;

                const response = await ai.models.generateContent({
                    model: "gemini-3.6-flash",
                    contents: fullContent,
                });

                if (response && response.text) {
                    return response.text;
                }
            } catch (geminiErr) {
                console.error("[GEMINI FALLBACK ERROR]", geminiErr.message);
            }
        }

        throw new Error("All AI providers (OpenRouter & Gemini) are currently unavailable.");
    } catch (error) {
        console.error("[ASK AI ERROR]", error.message);
        throw new Error(error.message || "AI service execution error");
    }
};