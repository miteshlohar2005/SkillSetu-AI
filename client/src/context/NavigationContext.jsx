import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const location = useLocation();

  const [navMode, setNavModeState] = useState(() => {
    const saved = localStorage.getItem("nav_layout_mode");
    if (saved === "topbar" || saved === "navbar") return "topbar";
    return "sidebar";
  });

  const [isCollapsed, setIsCollapsedState] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  const setNavMode = (mode) => {
    const normalized = mode === "topbar" || mode === "navbar" ? "topbar" : "sidebar";
    setNavModeState(normalized);
    localStorage.setItem("nav_layout_mode", normalized);
  };

  const toggleNavMode = () => {
    const nextMode = navMode === "sidebar" ? "topbar" : "sidebar";
    setNavMode(nextMode);
  };

  const setIsCollapsed = (collapsed) => {
    setIsCollapsedState(collapsed);
    localStorage.setItem("sidebar_collapsed", String(collapsed));
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const root = document.body;
    const isAuthPage = location.pathname === "/auth";

    if (navMode === "sidebar" && !isAuthPage) {
      root.classList.add("layout-mode-sidebar");
      if (isCollapsed) {
        root.classList.add("sidebar-collapsed");
      } else {
        root.classList.remove("sidebar-collapsed");
      }
    } else {
      root.classList.remove("layout-mode-sidebar");
      root.classList.remove("sidebar-collapsed");
    }
  }, [navMode, isCollapsed, location.pathname]);

  const effectiveNavMode = navMode;

  return (
    <NavigationContext.Provider
      value={{
        navMode: effectiveNavMode,
        savedNavMode: navMode,
        setNavMode,
        toggleNavMode,
        isCollapsed,
        setIsCollapsed,
        toggleCollapse,
        mobileOpen,
        setMobileOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        openSettings,
        closeSettings,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};
