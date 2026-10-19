import { useEffect, useState, useRef } from "react";
import moment from "moment";
import Markdown from "react-markdown";
import prism from "prismjs";
import "../../assets/prism.css";
import toast from "react-hot-toast";
import {
  FaCopy,
  FaCheck,
  FaShareAlt,
  FaVolumeUp,
  FaVolumeMute,
  FaRobot,
  FaUserAstronaut,
  FaGlobe,
} from "react-icons/fa";
import { BsCheckCircleFill } from "react-icons/bs";

const ChatMessage = ({ message, onPublishToggle }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const bottomRef = useRef(null);
  const wordRefs = useRef([]);

  useEffect(() => {
    const content = String(message?.content || "");

    if (message?.role !== "assistant" || message?.isImage || !message?.isNew) {
      setDisplayedText(content);
      return;
    }

    let index = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      if (index < content.length) {
        setDisplayedText((prev) => prev + content.charAt(index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 12);

    return () => clearInterval(interval);
  }, [message]);

  useEffect(() => {
    setTimeout(() => {
      prism.highlightAll();
    }, 0);
  }, [displayedText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard! 📋");
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleSpeak = (text) => {
    if (!text) return;

    window.speechSynthesis.cancel();

    if (speaking) {
      setSpeaking(false);
      setCurrentWordIndex(-1);
      toast("Voice playback stopped 🔇", { icon: "⏹️" });
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.0;

    const words = text.split(" ");
    let usedBoundary = false;
    let fallbackInterval = null;

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        usedBoundary = true;
        const charIndex = event.charIndex;
        const wordIndex = text.substring(0, charIndex).split(" ").length - 1;
        setCurrentWordIndex(wordIndex);
      }
    };

    utterance.onstart = () => {
      setSpeaking(true);
      setTimeout(() => {
        if (!usedBoundary) {
          let i = 0;
          fallbackInterval = setInterval(() => {
            setCurrentWordIndex(i++);
            if (i >= words.length) {
              clearInterval(fallbackInterval);
            }
          }, 350);
        }
      }, 400);
    };

    utterance.onend = () => {
      setSpeaking(false);
      setCurrentWordIndex(-1);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };

    utterance.onerror = () => {
      setSpeaking(false);
      setCurrentWordIndex(-1);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };

    window.speechSynthesis.speak(utterance);
    toast.success("Voice reading started 🔊");
  };

  useEffect(() => {
    if (!speaking) return;
    const el = wordRefs.current[currentWordIndex];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentWordIndex, speaking]);

  const handleShare = async () => {
    try {
      if (message.isImage) {
        const response = await fetch(message.content);
        const blob = await response.blob();
        const file = new File([blob], "ai-image.png", { type: blob.type || "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Generated AI Image",
          });
          toast.success("Image shared successfully! 🖼️");
        } else {
          await navigator.clipboard.writeText(message.content);
          toast.success("Image URL copied to clipboard! 🔗");
        }
      } else {
        if (navigator.share) {
          await navigator.share({
            title: "Smart AI Chat Response",
            text: message.content,
          });
          toast.success("Text shared successfully! 🔗");
        } else {
          await navigator.clipboard.writeText(message.content);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success("Text copied to clipboard! 📋");
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        toast.error("Share action canceled or not supported");
      }
    }
  };

  return (
    <div className="px-2 sm:px-4 py-1">
      {message.role === "user" ? (
        <div className="flex items-start justify-end my-3 gap-3 group">
          <div className="relative flex flex-col gap-1.5 px-5 py-3.5 pr-12 rounded-[22px] max-w-[88%] sm:max-w-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
            <button
              onClick={handleCopy}
              className="absolute top-2.5 right-2.5 opacity-80 hover:opacity-100 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer text-white"
              title="Copy message"
            >
              {copied ? <FaCheck size={12} className="text-emerald-300" /> : <FaCopy size={12} />}
            </button>

            <p className="text-sm sm:text-[15px] font-normal leading-relaxed break-words whitespace-pre-wrap">
              {message.content}
            </p>

            <span className="text-[10px] text-indigo-200/80 self-end mt-1 font-medium">
              {message.timestamp && `${moment(message.timestamp).format("hh:mm A, DD MMM")} • ${moment(message.timestamp).fromNow()}`}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shrink-0">
            <FaUserAstronaut size={14} className="text-indigo-400" />
          </div>
        </div>
      ) : (
        <div className="flex items-start my-3 gap-3 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shrink-0 mt-1">
            <FaRobot size={15} />
          </div>

          <div className="relative flex flex-col gap-2.5 px-5 py-4 pr-16 w-full max-w-full sm:max-w-2xl rounded-[24px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-md transition-all duration-300">
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              {!message.isImage && (
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="Copy response"
                >
                  {copied ? <FaCheck size={12} className="text-emerald-500" /> : <FaCopy size={12} />}
                </button>
              )}

              <button
                onClick={handleShare}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="Share"
              >
                <FaShareAlt size={12} />
              </button>

              {!message.isImage && (
                <button
                  onClick={() => handleSpeak(message.content)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    speaking
                      ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                  title={speaking ? "Stop reading" : "Read aloud"}
                >
                  {speaking ? <FaVolumeMute size={12} /> : <FaVolumeUp size={12} />}
                </button>
              )}

              {message.isImage && onPublishToggle && (
                <button
                  onClick={() => onPublishToggle(message)}
                  className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs ${
                    message.isPublished
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-emerald-50"
                  }`}
                  title={message.isPublished ? "Published to Community" : "Publish to Community"}
                >
                  <FaGlobe size={12} />
                  {message.isPublished && <BsCheckCircleFill size={10} />}
                </button>
              )}
            </div>

            {message.isImage ? (
              <div className="space-y-3 pt-2">
                <a
                  href={message.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl overflow-hidden shadow-md group/img relative"
                >
                  <img
                    src={message.content}
                    alt="AI Generated Artwork"
                    className="w-full max-h-96 object-cover rounded-2xl hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold backdrop-blur-xs">
                    Click to Open Full High-Res Image ↗
                  </div>
                </a>
              </div>
            ) : (
              <div className="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-[15px] leading-relaxed break-words pt-1 overflow-x-auto custom-scrollbar min-w-0">
                {speaking ? (
                  <div className="flex flex-wrap gap-1">
                    {displayedText.split(" ").map((word, i) => (
                      <span
                        key={i}
                        ref={(el) => (wordRefs.current[i] = el)}
                        className={
                          i === currentWordIndex
                            ? "bg-indigo-500 text-white px-1 rounded transition-colors"
                            : ""
                        }
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                ) : (
                  <Markdown>{displayedText}</Markdown>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              <span>{message.isImage ? "🎨 AI Studio Image" : "✨ AI Assistant"}</span>
              <span className="font-medium">
                {message.timestamp && `${moment(message.timestamp).format("hh:mm A, DD MMM")} • ${moment(message.timestamp).fromNow()}`}
              </span>
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessage;
