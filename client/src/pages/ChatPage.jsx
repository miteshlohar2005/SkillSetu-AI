import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ChatSidebar from "../components/Chat/ChatSidebar";
import ChatBox from "../components/Chat/ChatBox";
import { useSelector, useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { ServerUrl } from "../App";
import axios from "axios";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";

const ChatPage = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const { theme } = useTheme();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const axiosInstance = axios.create({
    baseURL: ServerUrl,
    withCredentials: true,
  });

  const fetchUserChats = async () => {
    try {
      const { data } = await axiosInstance.get("/api/chat/get");
      if (data.success) {
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error("Fetch chats error:", error);
    }
  };

  useEffect(() => {
    if (userData?._id) {
      fetchUserChats();
    }
  }, [userData?._id]);

  const handleCreateNewChat = () => {
    setSelectedChat(null);
    setIsMenuOpen(false);
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    try {
      const { data } = await axiosInstance.post("/api/chat/delete", { chatId });
      if (data.success) {
        setChats((prev) => prev.filter((c) => c._id !== chatId));
        if (selectedChat?._id === chatId) {
          setSelectedChat(null);
        }
        toast.success(data.message || "Chat deleted");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete chat");
    }
  };

  const handleCreditUpdate = (newCredits) => {
    if (userData) {
      dispatch(
        setUserData({
          ...userData,
          credits: newCredits,
        })
      );
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto pt-18 sm:pt-19 pb-2 sm:pb-3 px-2 sm:px-4 flex gap-3 sm:gap-4 overflow-hidden min-h-0">
        <ChatSidebar
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          chats={chats}
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
          createNewChat={handleCreateNewChat}
          deleteChat={handleDeleteChat}
          theme={theme}
        />

        <main className="flex-1 h-full min-h-0 min-w-0 flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-xl overflow-hidden">
          <ChatBox
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            setChats={setChats}
            userData={userData}
            onCreditUpdate={handleCreditUpdate}
            axiosInstance={axiosInstance}
            onOpenSidebar={() => setIsMenuOpen(true)}
            onNewChat={handleCreateNewChat}
          />
        </main>
      </div>
    </div>
  );
};

export default ChatPage;
