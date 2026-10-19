import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSkeleton, CardGridSkeleton } from "./SkeletonLoader";

export const pageVariants = {
  initial: {
    opacity: 0,
    y: 35,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    filter: "blur(4px)",
    transition: {
      duration: 0.25,
      ease: "easeInOut",
    },
  },
};

export const childVariants = {
  initial: { opacity: 0, y: 25 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const PageTransition = ({
  children,
  skeletonType = null,
  isLoading = false,
  showInitialSkeleton = false,
}) => {
  const [initialLoading, setInitialLoading] = useState(showInitialSkeleton);

  useEffect(() => {
    if (showInitialSkeleton) {
      const timer = setTimeout(() => {
        setInitialLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [showInitialSkeleton]);

  return (
    <AnimatePresence mode="wait">
      {isLoading || initialLoading ? (
        <motion.div
          key="skeleton-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="w-full"
        >
          {skeletonType === "dashboard" ? (
            <DashboardSkeleton />
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
              <CardGridSkeleton count={6} />
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="page-content"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageTransition;
