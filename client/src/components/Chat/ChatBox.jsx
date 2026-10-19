import { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import toast from "react-hot-toast";
import {
  FaMicrophone,
  FaPaperPlane,
  FaStop,
  FaImage,
  FaCommentDots,
  FaBars,
} from "react-icons/fa";
import { BsRobot, BsStars } from "react-icons/bs";

const ChatBox = ({
  selectedChat,
  setSelectedChat,
  setChats,
  userData,
  onCreditUpdate,
  axiosInstance,
  onOpenSidebar,
  onNewChat,
}) => {
  const containerRef = useRef(null);
  const controllerRef = useRef(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const activeChatIdRef = useRef(selectedChat?._id || null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("text");
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (selectedChat) {
      if (selectedChat._id !== activeChatIdRef.current) {
        setMessages(selectedChat.messages || []);
        activeChatIdRef.current = selectedChat._id;
      }
    } else {
      if (activeChatIdRef.current !== null) {
        setMessages([]);
        activeChatIdRef.current = null;
      }
    }
  }, [selectedChat]);

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch { }
      }
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const handleVoiceInput = async () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech Recognition not supported in this browser.");
      return;
    }

    if (isListeningRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch { }
      }
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          toast.error("Microphone access blocked. Please allow microphone in browser URL bar.");
          return;
        }
      }
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch { }
      }

      const recognition = new SpeechRecognition();
      recognition.lang = navigator.language || "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;

      const initialPrompt = prompt;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setPrompt(initialPrompt ? `${initialPrompt} ${transcript}` : transcript);
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        isListeningRef.current = false;
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          toast.error("Microphone permission denied.");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      isListeningRef.current = false;
      setIsListening(false);
    }
  };

  const handleStop = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
      toast("Generation stopped", { icon: "🛑" });
    }
    setLoading(false);
  };

  const createChatIfNeeded = async (firstUserMsg) => {
    if (selectedChat?._id) return selectedChat._id;

    try {
      const { data } = await axiosInstance.post(
        "/api/chat/create",
        {},
        { withCredentials: true }
      );

      if (data.success) {
        const newChatObj = {
          ...data.chat,
          messages: firstUserMsg ? [firstUserMsg] : [],
        };
        activeChatIdRef.current = data.chat._id;
        setChats((prev) => [newChatObj, ...prev]);
        setSelectedChat(newChatObj);
        return data.chat._id;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    return null;
  };

  const handlePublishToggle = async (message) => {
    try {
      if (!selectedChat?._id) return;
      const targetState = !message.isPublished;

      const { data } = await axiosInstance.post(
        "/api/message/publish",
        {
          chatId: selectedChat._id,
          messageId: message._id || message.content,
          isPublished: targetState,
        },
        { withCredentials: true }
      );

      if (data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === message._id || m.content === message.content
              ? { ...m, isPublished: targetState }
              : m
          )
        );
        setSelectedChat((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: (prev.messages || []).map((m) =>
              m._id === message._id || m.content === message.content
                ? { ...m, isPublished: targetState }
                : m
            ),
          };
        });
        setChats((prevChats) =>
          prevChats.map((c) =>
            c._id === selectedChat._id
              ? {
                ...c,
                messages: (c.messages || []).map((m) =>
                  m._id === message._id || m.content === message.content
                    ? { ...m, isPublished: targetState }
                    : m
                ),
              }
              : c
          )
        );
        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleSendMessage = async (customPrompt, customMode) => {
    const textToSend = (customPrompt !== undefined ? customPrompt : prompt).trim();
    const activeMode = customMode || mode;

    if (loading || !textToSend || !userData) return;

    setLoading(true);
    setPrompt("");

    const userMessage = {
      role: "user",
      content: textToSend,
      timestamp: new Date(),
      isImage: activeMode === "image",
    };

    setMessages((prev) => [...prev, userMessage]);

    const chatId = await createChatIfNeeded(userMessage);
    if (!chatId) {
      setLoading(false);
      return;
    }

    if (selectedChat?._id) {
      setSelectedChat((prev) =>
        prev
          ? {
            ...prev,
            messages: [...(prev.messages || []), userMessage],
            updatedAt: new Date(),
          }
          : prev
      );
      setChats((prevChats) =>
        prevChats.map((c) =>
          c._id === chatId
            ? {
              ...c,
              messages: [...(c.messages || []), userMessage],
              updatedAt: new Date(),
            }
            : c
        )
      );
    }

    try {
      controllerRef.current = new AbortController();

      const endpoint = activeMode === "image" ? "/api/message/image" : "/api/message/text";
      const { data } = await axiosInstance.post(
        endpoint,
        { chatId, prompt: textToSend },
        {
          withCredentials: true,
          signal: controllerRef.current.signal,
        }
      );

      if (data.success) {
        const newReply = { ...data.reply, isNew: true };

        setMessages((prev) => [...prev, newReply]);

        setSelectedChat((prev) => {
          if (!prev) return prev;
          const currentMsgs = prev.messages || [];
          return {
            ...prev,
            messages: [...currentMsgs, newReply],
            updatedAt: new Date(),
          };
        });

        setChats((prevChats) => {
          const existing = prevChats.find((c) => c._id === chatId);
          if (!existing) return prevChats;
          const filtered = prevChats.filter((c) => c._id !== chatId);
          return [
            {
              ...existing,
              messages: [...(existing.messages || []), newReply],
              updatedAt: new Date(),
            },
            ...filtered,
          ];
        });

        if (onCreditUpdate) {
          onCreditUpdate(data.creditsLeft);
        }
      } else {
        toast.error(data.message || "Failed to generate response");
      }
    } catch (error) {
      if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
        return;
      }
      toast.error(error.response?.data?.message || error.message);
    } finally {
      controllerRef.current = null;
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e?.preventDefault?.();
    handleSendMessage();
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full min-h-0 justify-between overflow-hidden relative">
      <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 md:hidden hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
            title="Open Conversations"
          >
            <FaBars size={14} />
          </button>

          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white shadow-xs shrink-0">
            <BsRobot size={16} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                SkillSetu Copilot AI
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Neural Engine</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate hidden xs:block">
              24/7 Official Statistical Methodology & Survey Guidance Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onNewChat || (() => setSelectedChat(null))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            <BsStars className="text-amber-500" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 md:p-6 space-y-2.5 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center my-auto py-4 sm:py-6 text-center px-2 sm:px-4 max-w-2xl mx-auto w-full">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-3 sm:mb-4">
              <BsRobot size={28} className="sm:text-3xl" />
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              SkillSetu Copilot AI
            </h2>

            <p className="mt-1.5 text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md">
              Ask statistical methodology questions, national accounts compilation sequences, sampling design rules, or generate visual concepts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-5 max-w-xl w-full">
              {[
                {
                  icon: <BsStars className="text-amber-500 shrink-0" />,
                  title: "CPI & Price Statistics",
                  desc: "Explain the formula difference between Laspeyres and Fisher price indices in CPI.",
                },
                {
                  icon: <FaCommentDots className="text-indigo-500 shrink-0" />,
                  title: "National Accounts (SNA 2008)",
                  desc: "How is Gross Value Added (GVA) at basic prices compiled from output?",
                },
                {
                  icon: <BsStars className="text-emerald-500 shrink-0" />,
                  title: "NSS Survey Sampling Design",
                  desc: "What are the stratification rules for Multi-Stage Stratified Sampling in NSS rounds?",
                },
                {
                  icon: <FaImage className="text-fuchsia-500 shrink-0" />,
                  title: "AI Statistical Infographic",
                  desc: "Infographic diagram of Data Collection to National Accounts dissemination",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const chosenMode = item.title.includes("Infographic") ? "image" : "text";
                    handleSendMessage(item.desc, chosenMode);
                  }}
                  className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer text-left group hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.icon}
                    <span className="truncate">{item.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <ChatMessage
            key={msg._id || `${index}-${msg.role}`}
            message={msg}
            onPublishToggle={handlePublishToggle}
          />
        ))}

        {loading && (
          <div className="flex items-start gap-3 my-3 px-2 sm:px-4 animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white flex items-center justify-center shadow-md shrink-0 mt-1">
              <BsRobot size={15} />
            </div>
            <div className="flex flex-col gap-2 px-5 py-3.5 rounded-[22px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span>SkillSetu Copilot is generating reasoning...</span>
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <span
                  className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5 sm:p-3.5 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 shrink-0 z-10">
        <form
          onSubmit={onSubmit}
          className="max-w-4xl mx-auto flex items-center gap-2 p-1.5 sm:p-2 pl-3.5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500 transition-all"
        >
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="text-xs sm:text-sm font-bold bg-transparent text-slate-700 dark:text-slate-300 outline-none cursor-pointer pr-1 shrink-0"
          >
            <option value="text" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
              💬 Text
            </option>
            <option value="image" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
              🎨 Image (2 Cr)
            </option>
          </select>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            placeholder={
              mode === "image"
                ? "Describe the visual or diagram you want to synthesize..."
                : "Ask methodology formulas, circular queries, or survey rules..."
            }
            className="flex-1 text-xs sm:text-sm bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none min-w-0 px-2 font-medium"
          />

          <div className="flex items-center gap-1.5 shrink-0 pr-0.5">
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`p-2 sm:p-2.5 rounded-full transition-all cursor-pointer ${isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              title={isListening ? "Listening..." : "Speak message"}
            >
              <FaMicrophone size={12} />
            </button>

            {loading ? (
              <button
                type="button"
                onClick={handleStop}
                className="p-2 sm:p-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all cursor-pointer"
                title="Stop generation"
              >
                <FaStop size={12} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="p-2 sm:p-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-md cursor-pointer"
                title="Send message"
              >
                <FaPaperPlane size={12} />
              </button>
            )}
          </div>
        </form>

        <p className="text-[10px] text-slate-400 text-center mt-1.5 hidden sm:block">
          SkillSetu Copilot is grounded in domain statistical standards. Verify official circulars for compliance.
        </p>
      </div>
    </div>
  );
};

export default ChatBox;
