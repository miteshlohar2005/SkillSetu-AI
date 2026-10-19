import { useNavigate } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi2";
import { motion } from "framer-motion";

const BackButton = ({
  to,
  fallbackUrl = "/dashboard",
  label = "Back",
  className = "",
  variant = "default", 
  onClick,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (to) {
      navigate(to);
      return;
    }
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackUrl);
    }
  };

  if (variant === "subtle") {
    return (
      <button
        type="button"
        onClick={handleBack}
        className={`inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors group cursor-pointer select-none ${className}`}
      >
        <HiArrowLeft className="group-hover:-translate-x-1 transition-transform" size={14} />
        <span>{label}</span>
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleBack}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 shadow-xs transition-all group cursor-pointer select-none ${className}`}
      >
        <HiArrowLeft className="group-hover:-translate-x-1 transition-transform text-blue-600 dark:text-blue-400" size={14} />
        <span>{label}</span>
      </motion.button>
    );
  }

  if (variant === "iconOnly") {
    return (
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBack}
        title={label}
        aria-label={label}
        className={`p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 shadow-xs transition-all group cursor-pointer ${className}`}
      >
        <HiArrowLeft className="group-hover:-translate-x-1 transition-transform text-blue-600 dark:text-blue-400" size={16} />
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400/60 dark:hover:border-blue-600/60 shadow-xs hover:shadow-md transition-all group cursor-pointer select-none ${className}`}
    >
      <HiArrowLeft className="group-hover:-translate-x-1 transition-transform text-blue-600 dark:text-blue-400" size={15} />
      <span>{label}</span>
    </motion.button>
  );
};

export default BackButton;
