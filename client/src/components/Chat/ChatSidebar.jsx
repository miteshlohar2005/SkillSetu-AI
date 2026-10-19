import { useState } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaSearch,
  FaTrashAlt,
  FaImages,
  FaMoon,
  FaSun,
  FaTimes,
  FaComments,
} from "react-icons/fa";
import { BsRobot } from "react-icons/bs";
import { useTheme } from "../../context/ThemeContext";
import BackButton from "../BackButton";

const ChatSidebar = ({
  isMenuOpen,
  setIsMenuOpen,
  chats,
  selectedChat,
  setSelectedChat,
  createNewChat,
  deleteChat,
  theme: propTheme,
}) => {
  const navigate = useNavigate();
  const themeContext = useTheme();
  const theme = propTheme || themeContext?.theme || "system";
  const resolvedTheme = themeContext?.resolvedTheme || (theme === "dark" ? "dark" : "light");
  const toggleTheme = themeContext?.toggleTheme;
  const [search, setSearch] = useState("");

  const filteredChats = chats?.filter((chat) => {
    if (!chat) return false;
    const firstMsg = chat.messages?.[0]?.content || "";
    const name = chat.name || "";
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      firstMsg.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <>
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`flex flex-col h-full w-72 lg:w-80 max-w-[85vw] p-3.5 sm:p-4 bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-xl transition-all duration-300 z-50 overflow-hidden rounded-2xl md:rounded-3xl ${
          isMenuOpen
            ? "fixed inset-y-0 left-0 top-0 bottom-0 z-50 shadow-2xl rounded-none md:rounded-3xl translate-x-0"
            : "fixed md:static -translate-x-full md:translate-x-0 inset-y-0 left-0 top-0 bottom-0"
        }`}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <BackButton
            fallbackUrl="/ai-models"
            label="Back to AI Models"
            variant="subtle"
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
          />

          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer"
            title="Close menu"
          >
            <FaTimes size={15} />
          </button>
        </div>

        <div className="flex items-center gap-2.5 pt-3 pb-1 shrink-0">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-sm shrink-0">
            <BsRobot size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-800 dark:text-white">AI Workspace</h2>
            <p className="text-[10px] text-slate-400">Conversations & Studio</p>
          </div>
        </div>

        <button
          onClick={createNewChat}
          className="flex items-center justify-center gap-2 w-full py-3 mt-4 text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:opacity-95 text-sm font-semibold rounded-2xl shadow-[0_8px_20px_rgba(79,70,229,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
        >
          <FaPlus size={12} />
          <span>New Chat</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-2.5 mt-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all shrink-0">
          <FaSearch size={12} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search conversation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-1.5 pr-1 custom-scrollbar">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
            Recent Sessions
          </p>

          {filteredChats?.length > 0 ? (
            filteredChats.map((chat) => {
              const isSelected = selectedChat?._id === chat._id;
              const displayTitle =
                chat.messages?.[0]?.content?.slice(0, 32) || chat.name || "Conversation";

              return (
                <div
                  key={chat._id}
                  onClick={() => {
                    setSelectedChat(chat);
                    setIsMenuOpen(false);
                  }}
                  className={`group relative flex items-center justify-between p-2.5 px-3 rounded-xl cursor-pointer text-xs transition-all duration-200 border ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold shadow-xs"
                      : "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 border-transparent text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <FaComments
                      size={13}
                      className={isSelected ? "text-indigo-600" : "text-slate-400"}
                    />
                    <div className="truncate">
                      <p className="truncate">{displayTitle}</p>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {moment(chat.updatedAt).fromNow()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => deleteChat(e, chat._id)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
                    title="Delete Chat"
                  >
                    <FaTrashAlt size={11} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No conversations found.
            </div>
          )}
        </div>

        <div className="pt-3 mt-auto border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
          <div
            onClick={() => navigate("/community")}
            className="flex items-center gap-2.5 p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs font-medium transition-colors"
          >
            <FaImages className="text-indigo-500" size={14} />
            <span>Community Gallery</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              {resolvedTheme === "dark" ? <FaMoon className="text-indigo-400" /> : <FaSun className="text-amber-500" />}
              <span>{theme === "system" ? "System Default" : resolvedTheme === "dark" ? "Dark Mode" : "Light Mode"}</span>
            </div>

            <button
              onClick={toggleTheme}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Toggle
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;
