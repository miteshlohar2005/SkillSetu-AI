import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { ServerUrl } from "../App";
import toast from "react-hot-toast";
import {
  motion,
  useDragControls,
  useMotionValue,
  animate,
} from "framer-motion";
import {
  FaComments,
  FaTimes,
  FaMinus,
  FaFilePdf,
  FaDownload,
  FaBullhorn,
  FaHeadset,
  FaPaperclip,
  FaVolumeUp,
  FaVolumeMute,
  FaCheckDouble,
  FaEye,
} from "react-icons/fa";
import {
  BsShieldCheck,
  BsFillSendFill,
  BsCircleFill,
  BsLightningChargeFill,
} from "react-icons/bs";
import { MdDragIndicator, MdRestartAlt } from "react-icons/md";

const OFFICER_PROMPTS = [
  "Request latest PLFS sampling weights guideline",
  "How can I improve my SNA 2008 GVA score?",
  "When is the next cadre viva mock interview drill?",
  "Technical query regarding microdata imputation",
];

const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const CORE_PORTAL_PAGES = [
  "/",
  "/welcome",
  "/dashboard",
  "/competencies",
  "/skill-gaps",
  "/skill-gap-analysis",
  "/job-readiness",
  "/history",
  "/materials",
  "/mcq-create",
  "/quizzes",
  "/assignments",
  "/learning-path",
  "/portal-comparison",
  "/settings",
];

const isAllowedRoute = (pathname) => {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return CORE_PORTAL_PAGES.some((coreRoute) => {
    if (coreRoute === "/") return clean === "/" || clean === "/welcome";
    return clean === coreRoute || clean.startsWith(`${coreRoute}/`);
  });
};

const LiveAdminChatWidget = () => {
  const location = useLocation();
  const isAllowed = isAllowedRoute(location.pathname);
  const { userData } = useSelector((state) => state.user);

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem("nssta_chat_sound");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const messagesContainerRef = useRef(null);
  const chatWindowRef = useRef(null);
  const dragControls = useDragControls();
  const isDraggingRef = useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const handleOpenHelpdesk = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener("open-nssta-helpdesk", handleOpenHelpdesk);
    return () => window.removeEventListener("open-nssta-helpdesk", handleOpenHelpdesk);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        !isMinimized &&
        chatWindowRef.current &&
        !chatWindowRef.current.contains(event.target) &&
        !event.target.closest(".preview-image-modal")
      ) {
        setIsMinimized(true);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, isMinimized]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("nssta_chat_sound", String(next));
    } catch (e) {
      console.log(e);
    }
  };

  const [dragConstraints, setDragConstraints] = useState({
    top: -500,
    bottom: 0,
    left: -800,
    right: 0,
  });

  const updateConstraints = useCallback(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const widgetHeight = isOpen
      ? isMinimized
        ? 68
        : Math.min(580, vh * 0.85)
      : 60;
    const widgetWidth = isOpen ? Math.min(420, vw - 24) : 260;

    const maxUp = Math.max(0, vh - widgetHeight - 20);
    const maxLeft = Math.max(0, vw - widgetWidth - 20);

    setDragConstraints({
      top: -maxUp,
      bottom: 0,
      left: -maxLeft,
      right: 0,
    });
  }, [isOpen, isMinimized]);

  useEffect(() => {
    updateConstraints();
    window.addEventListener("resize", updateConstraints);
    return () => window.removeEventListener("resize", updateConstraints);
  }, [updateConstraints]);

  const resetPosition = (e) => {
    e?.stopPropagation?.();
    animate(x, 0, { type: "spring", stiffness: 350, damping: 25 });
    animate(y, 0, { type: "spring", stiffness: 350, damping: 25 });
  };

  const handleOpenChat = () => {
    if (isDraggingRef.current) return;
    const vh = window.innerHeight;
    const openHeight = Math.min(580, vh * 0.85);
    const maxUp = Math.max(0, vh - openHeight - 24);
    if (y.get() < -maxUp) {
      animate(y, -maxUp, { type: "spring", stiffness: 300, damping: 25 });
    }
    setIsOpen(true);
    setIsMinimized(false);
  };

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        880,
        audioCtx.currentTime + 0.15,
      );
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.log(e);
    }
  };

  const fetchMessages = async (isBackground = false) => {
    try {
      const { data } = await axios.get(
        `${ServerUrl}/api/support/officer/messages`,
        {
          withCredentials: true,
        },
      );

      if (data.success) {
        const msgs = data.messages || [];
        setMessages(msgs);

        if (msgs.length > lastMessageCount) {
          if (lastMessageCount > 0) {
            const newAdminMsgs = msgs
              .slice(lastMessageCount)
              .filter(
                (m) =>
                  m.senderRole === "admin" &&
                  (!userData?._id || m.senderId?.toString() !== userData._id.toString()),
              );
            if (newAdminMsgs.length > 0) {
              playChime();
              if (!isOpen) {
                setUnreadCount((prev) => prev + newAdminMsgs.length);
                const firstNew = newAdminMsgs[0];
                if (firstNew.isBroadcast) {
                  toast(`📢 ${firstNew.senderName}: ${firstNew.message}`, {
                    duration: 7500,
                    style: {
                      borderRadius: "14px",
                      background: "#0f172a",
                      color: "#fbbf24",
                      border: "1px solid #f59e0b",
                      boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.25)",
                      maxWidth: "480px",
                      fontSize: "13px",
                      lineHeight: "1.4",
                    },
                  });
                } else {
                  toast(`📩 ${firstNew.senderName || "NSSTA Secretariat"}: ${firstNew.message}`, {
                    duration: 7500,
                    style: {
                      borderRadius: "14px",
                      background: "#0f172a",
                      color: "#93c5fd",
                      border: "1px solid #3b82f6",
                      boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.25)",
                      maxWidth: "480px",
                      fontSize: "13px",
                      lineHeight: "1.4",
                    },
                  });
                }
              }
            }
          } else if (lastMessageCount === 0) {
            const unread = msgs.filter(
              (m) =>
                m.senderRole === "admin" &&
                !m.isRead &&
                (!userData?._id || m.senderId?.toString() !== userData._id.toString()),
            );
            if (unread.length > 0 && !isOpen) {
              setUnreadCount(unread.length);
            }
          }
          setLastMessageCount(msgs.length);
        }
      }
    } catch (error) {
      if (!isBackground) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    if (!isAllowed || !userData) return;
    fetchMessages();
    const interval = setInterval(() => fetchMessages(true), 2500);
    return () => clearInterval(interval);
  }, [lastMessageCount, isOpen, isAllowed, userData]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    const messageText = inputText.trim();
    setInputText("");
    const fileToSend = selectedFile;
    setSelectedFile(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append(
        "message",
        messageText || "Attached reference document for review.",
      );
      if (fileToSend) {
        formData.append("file", fileToSend);
      }

      const { data } = await axios.post(
        `${ServerUrl}/api/support/officer/send`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );

      if (data.success) {
        fetchMessages();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to deliver message.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt) => {
    setInputText(prompt);
  };

  if (!userData || !isAllowed) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-50 select-none">
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={!isOpen}
          dragConstraints={dragConstraints}
          dragMomentum={false}
          dragElastic={0.05}
          onDragStart={() => {
            isDraggingRef.current = true;
          }}
          onDragEnd={() => {
            setTimeout(() => {
              isDraggingRef.current = false;
            }, 120);
          }}
          style={{ x, y }}
          whileDrag={{ scale: 1.02, zIndex: 60 }}
          className="pointer-events-auto fixed bottom-1 right-1"
        >
          {!isOpen && (
            <button
              onClick={handleOpenChat}
              className="relative group p-3 sm:p-3.5 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white shadow-2xl hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300 flex items-center gap-2.5 sm:gap-3 cursor-grab active:cursor-grabbing border-2 border-blue-400/40 backdrop-blur-md"
              title="Live Helpdesk & NSSTA Faculty Direct Chat • Drag to move anywhere on screen"
            >
              <div
                className="text-blue-300/70 group-hover:text-white transition-colors"
                title="Drag anywhere on screen"
              >
                <MdDragIndicator size={18} />
              </div>

              <div className="relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <FaHeadset
                    size={19}
                    className="text-blue-200 group-hover:text-white transition-colors"
                  />
                </div>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>

              <div className="hidden sm:flex flex-col text-left pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black tracking-wider uppercase text-blue-300">
                    SkillSetu AI
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-black text-white leading-tight">
                  Live Faculty Helpdesk
                </span>
              </div>

              {unreadCount > 0 && (
                <span className="absolute -top-2.5 -left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white shadow-lg animate-bounce border-2 border-white dark:border-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {isOpen && (
            <div
              ref={chatWindowRef}
              className={`w-[320px] sm:w-[380px] max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? "h-[68px]" : "h-[580px] max-h-[85vh]"
                }`}
            >
              <div className="h-1.5 w-full grid grid-cols-3">
                <div className="bg-[#FF9933]" />
                <div className="bg-[#FFFFFF]" />
                <div className="bg-[#138808]" />
              </div>

              <div
                onClick={() => {
                  if (isMinimized) setIsMinimized(false);
                }}
                onPointerDown={(e) => {
                  if (e.target.closest("button") || e.target.closest("input") || e.target.closest("a")) return;
                  dragControls.start(e);
                }}
                onDoubleClick={resetPosition}
                className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 cursor-grab active:cursor-grabbing select-none"
                title="Drag header to move window • Double-click to reset"
              >
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div
                    className="text-slate-400 hover:text-blue-300 transition-colors"
                    title="Drag to reposition window"
                  >
                    <MdDragIndicator size={18} />
                  </div>
                  <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 flex items-center justify-center text-white shadow-inner shrink-0">
                    <FaHeadset size={18} />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-xs sm:text-sm text-white">
                        NSSTA Secretariat & Faculty
                      </h3>
                      <BsShieldCheck size={13} className="text-blue-400 shrink-0" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <BsCircleFill size={6} />
                        <span>Live Direct Desk</span>
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        • Movable
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetPosition(e);
                    }}
                    className="p-1.5 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Reset to default position"
                  >
                    <MdRestartAlt size={14} />
                  </button>
                  <button
                    onClick={toggleSound}
                    className="p-1.5 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title={soundEnabled ? "Mute Chime" : "Enable Chime"}
                  >
                    {soundEnabled ? (
                      <FaVolumeUp size={12} className="text-blue-400" />
                    ) : (
                      <FaVolumeMute size={12} />
                    )}
                  </button>
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1.5 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title={isMinimized ? "Expand Chat" : "Minimize Chat"}
                  >
                    <FaMinus size={11} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Close Helpdesk"
                  >
                    <FaTimes size={13} />
                  </button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-50/70 dark:bg-slate-950/50">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <div className="w-14 h-14 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center border border-blue-200 dark:border-blue-800 shadow-inner">
                          <FaComments size={26} />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 dark:text-slate-200 text-sm">
                            Academy Training & In-Service Helpdesk
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                            Ask NSSTA faculty for statistical methodology
                            guidance, report document requisitions, or assessment
                            clarifications.
                          </p>
                        </div>

                        <div className="w-full space-y-1.5 pt-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block text-left">
                            Suggested Inquiries
                          </span>
                          {OFFICER_PROMPTS.map((prompt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handlePromptClick(prompt)}
                              className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-left text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition flex items-center justify-between cursor-pointer"
                            >
                              <span className="truncate">{prompt}</span>
                              <BsLightningChargeFill
                                size={10}
                                className="text-amber-500 shrink-0 ml-1.5"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      (messages || []).map((msg, index) => {
                        const isOfficer =
                          msg.senderRole === "learner" ||
                          (userData?._id &&
                            (msg.senderId === userData._id ||
                              msg.senderId?._id === userData._id ||
                              msg.senderId?.toString() === userData._id.toString()));
                        const isBroadcast = msg.isBroadcast;

                        if (isBroadcast) {
                          return (
                            <div
                              key={msg._id || index}
                              className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-400/40 text-slate-800 dark:text-slate-100 text-xs space-y-1.5 shadow-xs my-2"
                            >
                              <div className="flex items-center gap-2 font-black text-[11px] text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                                <FaBullhorn
                                  size={12}
                                  className="text-amber-600 animate-pulse"
                                />
                                <span>{msg.senderName}</span>
                              </div>
                              <p className="leading-relaxed text-xs">
                                {msg.message}
                              </p>
                              <span className="text-[10px] font-bold text-amber-700/80 dark:text-amber-400/80 block pt-1">
                                {formatDateTime(msg.createdAt)}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg._id || index}
                            className={`flex flex-col ${isOfficer ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-center gap-1.5 px-1 mb-1">
                              <span className="text-[10px] font-bold text-slate-400">
                                {isOfficer ? "You" : msg.senderName || "NSSTA Secretariat & Faculty"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {formatDateTime(msg.createdAt)}
                              </span>
                            </div>

                            <div
                              className={`max-w-[85%] p-3.5 rounded-3xl text-xs leading-relaxed space-y-2 shadow-xs ${isOfficer
                                ? "bg-gradient-to-tr from-blue-700 to-indigo-700 text-white rounded-br-xs"
                                : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200 dark:border-slate-700"
                                }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.message}</p>

                              {msg.attachmentData && (
                                <div className="pt-1">
                                  {msg.attachmentData.startsWith(
                                    "data:image/",
                                  ) ? (
                                    <div
                                      className="relative group cursor-pointer"
                                      onClick={() =>
                                        setPreviewImage(msg.attachmentData)
                                      }
                                    >
                                      <img
                                        src={msg.attachmentData}
                                        alt="Attachment"
                                        className="max-h-44 rounded-2xl border border-white/20 object-cover w-full"
                                      />
                                      <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-[11px] gap-1">
                                        <FaEye size={12} />
                                        <span>Click to enlarge</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <a
                                      href={msg.attachmentData}
                                      download={
                                        msg.attachmentName || "attachment"
                                      }
                                      className={`p-2.5 rounded-2xl text-[11px] font-bold flex items-center justify-between gap-2 transition ${isOfficer
                                        ? "bg-blue-800 text-white hover:bg-blue-900"
                                        : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                        }`}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <FaFilePdf
                                          className="text-rose-400 shrink-0"
                                          size={14}
                                        />
                                        <span className="truncate">
                                          {msg.attachmentName ||
                                            "Attached Document"}
                                        </span>
                                      </div>
                                      <FaDownload
                                        size={11}
                                        className="shrink-0"
                                      />
                                    </a>
                                  )}
                                </div>
                              )}

                              {isOfficer && (
                                <div className="flex items-center justify-end text-[10px] text-blue-200 gap-1 pt-0.5">
                                  <FaCheckDouble
                                    size={10}
                                    className="text-blue-300"
                                  />
                                  <span>Delivered</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {selectedFile && (
                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/60 border-t border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 shrink-0">
                      <span className="truncate font-semibold text-[11px]">
                        📎 {selectedFile.name} (
                        {Math.round(selectedFile.size / 1024)} KB)
                      </span>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-slate-400 hover:text-rose-500 font-bold ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
                  >
                    <label
                      htmlFor="chat-file-input"
                      className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer transition flex items-center justify-center shrink-0"
                      title="Attach File/Image"
                    >
                      <FaPaperclip size={13} />
                      <input
                        id="chat-file-input"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.docx,.txt"
                        onChange={(e) =>
                          setSelectedFile(e.target.files[0] || null)
                        }
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Ask faculty or request guidance..."
                      className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 border-0 rounded-2xl text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      type="submit"
                      disabled={loading || (!inputText.trim() && !selectedFile)}
                      className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shrink-0 flex items-center justify-center"
                    >
                      {loading ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <BsFillSendFill size={13} />
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {previewImage && (
        <div
          className="preview-image-modal fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs hover:bg-rose-600 transition shadow-lg cursor-pointer"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="rounded-2xl max-h-[80vh] w-auto object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default LiveAdminChatWidget;
