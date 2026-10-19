import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useMotionValue,
  animate,
} from "framer-motion";
import { FaArrowUp } from "react-icons/fa";
import { MdDragIndicator } from "react-icons/md";

import { useTranslation } from "react-i18next";

const HELPDESK_ROUTES = new Set([
  "",
  "/",
  "/welcome",
  "/dashboard",
  "/history",
  "/admin",
]);

const isHelpdeskRoute = (pathname) => {
  const clean = (pathname || "").replace(/\/+$/, "") || "/";
  return HELPDESK_ROUTES.has(clean) || clean.startsWith("/admin");
};

const toHindiDigits = (num) => {
  const hindiDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(num).replace(/[0-9]/g, (d) => hindiDigits[Number(d)]);
};

const ScrollProgressBar = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const { scrollYProgress } = useScroll();
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [currentLang, setCurrentLang] = useState(
    () => localStorage.getItem("sankhya_lang") || i18n?.language || "en"
  );

  const boundaryRef = useRef(null);
  const isDraggingRef = useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const hasHelpdesk = isHelpdeskRoute(location.pathname);

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const updateScroll = useCallback(() => {
    const el = document.scrollingElement || document.documentElement || document.body;
    const scrollTop =
      window.scrollY ||
      window.pageYOffset ||
      el.scrollTop ||
      0;
    const scrollHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      el.scrollHeight || 0
    );
    const clientHeight =
      window.innerHeight || el.clientHeight || 0;
    const maxScroll = scrollHeight - clientHeight;

    if (maxScroll <= 50 || scrollTop < 50) {
      setScrollPercent(0);
      setIsVisible(false);
      return;
    }

    const pct = Math.min(
      100,
      Math.max(1, Math.round((scrollTop / maxScroll) * 100))
    );
    setScrollPercent(pct);
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const el = document.scrollingElement || document.documentElement || document.body;
      const scrollTop =
        window.scrollY ||
        window.pageYOffset ||
        el.scrollTop ||
        0;

      if (scrollTop < 50) {
        setScrollPercent(0);
        setIsVisible(false);
        return;
      }

      const pct = Math.min(100, Math.max(1, Math.round(latest * 100)));
      setScrollPercent(pct);
      setIsVisible(true);
    });

    updateScroll();

    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });

    let observer;
    if (typeof ResizeObserver !== "undefined" && document.body) {
      observer = new ResizeObserver(() => {
        updateScroll();
      });
      observer.observe(document.body);
    }

    const t1 = setTimeout(updateScroll, 100);
    const t2 = setTimeout(updateScroll, 500);

    const onLangChange = (e) => {
      const nextLang =
        e?.detail?.language ||
        localStorage.getItem("sankhya_lang") ||
        i18n?.language ||
        "en";
      setCurrentLang(nextLang);
      setTimeout(updateScroll, 150);
      setTimeout(updateScroll, 500);
    };
    window.addEventListener("sankhyaLanguageChange", onLangChange);

    return () => {
      unsubscribe();
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
      window.removeEventListener("sankhyaLanguageChange", onLangChange);
      if (observer) observer.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [location.pathname, scrollYProgress, updateScroll, i18n?.language]);

  useEffect(() => {
    const active =
      localStorage.getItem("sankhya_lang") ||
      (i18n?.language?.startsWith("hi") ? "hi" : "en");
    if (active) setCurrentLang(active);
  }, [i18n?.language]);

  const scrollToTop = () => {
    if (isDraggingRef.current) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetPosition = (e) => {
    e?.stopPropagation?.();
    animate(x, 0, { type: "spring", stiffness: 350, damping: 25 });
    animate(y, 0, { type: "spring", stiffness: 350, damping: 25 });
  };

  const isHindi = currentLang === "hi" || i18n?.language?.startsWith("hi");
  const displayValue = isHindi ? toHindiDigits(scrollPercent) : scrollPercent;
  const displayText = `${displayValue}%`;

  const tooltipTitle = isHindi
    ? `शीर्ष पर जाएं (${displayText}) • स्क्रीन पर कहीं भी खींचें • रीसेट के लिए डबल-क्लिक करें`
    : `Scroll to top (${displayText}) • Drag to move anywhere on screen • Double-click to reset`;

  const ariaText = isHindi
    ? `स्क्रॉल प्रगति ${displayText}, ऊपर जाने के लिए क्लिक करें या खींचें`
    : `Scroll progress ${displayText}, drag to move or click to scroll to top`;

  return (
    <>
      <div
        translate="no"
        className="notranslate fixed top-0 left-0 right-0 z-[120] pointer-events-none h-1 bg-transparent"
      >
        <motion.div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 origin-left shadow-xs shadow-blue-500/50"
          style={{ scaleX }}
        />
      </div>

      <div
        ref={boundaryRef}
        translate="no"
        className="notranslate fixed inset-1 pointer-events-none z-40"
      >
        <AnimatePresence>
          {isVisible && (
            <motion.div
              key="scroll-progress-pill"
              translate="no"
              drag
              style={{ x, y }}
              dragConstraints={boundaryRef}
              dragMomentum={false}
              dragElastic={0.08}
              onDragStart={() => {
                isDraggingRef.current = true;
              }}
              onDragEnd={() => {
                setTimeout(() => {
                  isDraggingRef.current = false;
                }, 120);
              }}
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 10 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileDrag={{ scale: 1.1, zIndex: 60 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToTop}
              onDoubleClick={resetPosition}
              title={tooltipTitle}
              aria-label={ariaText}
              className={`notranslate pointer-events-auto absolute ${
                hasHelpdesk ? "bottom-20" : "bottom-2"
              } right-2 flex items-center gap-1.5 sm:gap-2 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-grab active:cursor-grabbing group select-none`}
            >
              <div
                className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors"
                title={isHindi ? "कहीं भी खींचें" : "Drag to move anywhere"}
              >
                <MdDragIndicator size={16} />
              </div>

              <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600 dark:text-blue-400 transition-all duration-150"
                    strokeDasharray={`${scrollPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <FaArrowUp
                  size={8}
                  className="absolute text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:-translate-y-0.5 transition-transform"
                />
              </div>

              <span
                translate="no"
                className="notranslate text-xs font-mono font-black tracking-tight pr-1"
              >
                {displayText}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ScrollProgressBar;
