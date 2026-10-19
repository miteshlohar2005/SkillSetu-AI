import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Auth from "../pages/Auth";

const AuthModel = ({ onClose }) => {
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (userData && userData.isProfileCompleted) {
      onClose();
    }
  }, [userData, onClose]);

  const handleAttemptClose = () => {
    if (userData && !userData.isProfileCompleted) {
      toast.error("Please complete your profile configuration first.");
      return;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md px-4"
      >
        <div className="absolute inset-0" onClick={handleAttemptClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 200,
          }}
          className="relative w-full max-w-md z-10"
        >
          <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-fuchsia-500/30 blur-2xl opacity-70" />

          <button
            onClick={handleAttemptClose}
            aria-label="Close modal"
            className="absolute top-3 right-8 z-50 w-10 h-10 rounded-full bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl flex items-center justify-center text-slate-700 hover:text-black hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            <FaTimes size={16} />
          </button>

          <div className="relative rounded-[2.5rem] overflow-hidden border border-white/20 shadow-[0_20px_80px_rgba(0,0,0,0.15)]">
            <Auth isModel={true} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModel;
