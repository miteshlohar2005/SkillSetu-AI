import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ServerUrl } from "../App";
import { motion, AnimatePresence } from "framer-motion";
import { useOutsideClick } from "../utils/outsideClick";
import { useDiagnostic } from "../context/DiagnosticContext";
import {
  BsBellFill,
  BsBell,
  BsCheckCircleFill,
  BsArrowRight,
  BsShieldCheck,
} from "react-icons/bs";
import {
  FaBullhorn,
  FaTasks,
  FaMicrophone,
  FaShieldAlt,
  FaBookOpen,
  FaComments,
  FaClock,
  FaUserTie,
  FaCheckCircle,
} from "react-icons/fa";
import { HiX } from "react-icons/hi";

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

const NotificationBell = () => {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const { startDiagnosticQuiz } = useDiagnostic();
  const [broadcasts, setBroadcasts] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [adminConversations, setAdminConversations] = useState([]);
  const [officerMessages, setOfficerMessages] = useState([]);
  const [diagnosticStatus, setDiagnosticStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      const stored =
        localStorage.getItem("skillsetu_read_notifications") ||
        localStorage.getItem("sankhya_read_notifications");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useOutsideClick(() => setIsOpen(false));

  const isAdminOrTrainer = Boolean(
    userData?.role === "admin" || userData?.role === "trainer"
  );

  const targetRole =
    userData?.jobRole ||
    userData?.targetCadre ||
    "Indian Statistical Service (ISS) Officer";

  const isQuizCompleted = Boolean(
    diagnosticStatus?.isQuizCompleted ||
    (userData?.quizzesCompleted && userData.quizzesCompleted > 0)
  );

  const isInterviewCompleted = Boolean(
    diagnosticStatus?.isInterviewCompleted ||
    diagnosticStatus?.diagnosticInterview?.status === "completed"
  );

  const isIntakePending = !isAdminOrTrainer && (!isQuizCompleted || !isInterviewCompleted);

  const fetchNotificationsData = useCallback(async () => {
    if (!userData) return;
    try {
      if (isAdminOrTrainer) {
        // Fetch Admin notifications: Material Requests, Officer Conversations, Broadcasts
        const [materialsRes, convsRes, broadcastsRes] = await Promise.allSettled([
          axios.get(`${ServerUrl}/api/admin/material-requests`, {
            withCredentials: true,
          }),
          axios.get(`${ServerUrl}/api/support/admin/conversations`, {
            withCredentials: true,
          }),
          axios.get(`${ServerUrl}/api/support/broadcasts`, {
            withCredentials: true,
          }),
        ]);

        if (materialsRes.status === "fulfilled" && materialsRes.value?.data?.success) {
          setMaterialRequests(materialsRes.value.data.requests || []);
        }
        if (convsRes.status === "fulfilled" && convsRes.value?.data?.success) {
          setAdminConversations(convsRes.value.data.conversations || []);
        }
        if (broadcastsRes.status === "fulfilled" && broadcastsRes.value?.data?.success) {
          setBroadcasts(broadcastsRes.value.data.broadcasts || []);
        }
      } else {
        const [myMaterialsRes, messagesRes, diagnosticRes, broadcastsRes] =
          await Promise.allSettled([
            axios.get(`${ServerUrl}/api/materials/my-requests`, {
              withCredentials: true,
            }),
            axios.get(`${ServerUrl}/api/support/officer/messages`, {
              withCredentials: true,
            }),
            axios.get(`${ServerUrl}/api/competency/diagnostic-status`, {
              withCredentials: true,
            }),
            axios.get(`${ServerUrl}/api/support/broadcasts`, {
              withCredentials: true,
            }),
          ]);

        if (myMaterialsRes.status === "fulfilled" && myMaterialsRes.value?.data?.success) {
          setMaterialRequests(myMaterialsRes.value.data.requests || []);
        }
        if (messagesRes.status === "fulfilled" && messagesRes.value?.data?.success) {
          setOfficerMessages(messagesRes.value.data.messages || []);
        }
        if (diagnosticRes.status === "fulfilled" && diagnosticRes.value?.data?.success) {
          setDiagnosticStatus(diagnosticRes.value.data);
        }
        if (broadcastsRes.status === "fulfilled" && broadcastsRes.value?.data?.success) {
          setBroadcasts(broadcastsRes.value.data.broadcasts || []);
        }
      }
    } catch (err) {
      console.error("Error fetching notification data:", err);
    }
  }, [userData, isAdminOrTrainer]);

  useEffect(() => {
    fetchNotificationsData();
    const interval = setInterval(fetchNotificationsData, 20000);

    const handleRefetch = () => {
      fetchNotificationsData();
    };

    window.addEventListener("focus", handleRefetch);
    window.addEventListener("diagnostic-updated", handleRefetch);
    window.addEventListener("assessmentCompleted", handleRefetch);
    window.addEventListener("material-request-updated", handleRefetch);
    window.addEventListener("support-message-sent", handleRefetch);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleRefetch);
      window.removeEventListener("diagnostic-updated", handleRefetch);
      window.removeEventListener("assessmentCompleted", handleRefetch);
      window.removeEventListener("material-request-updated", handleRefetch);
      window.removeEventListener("support-message-sent", handleRefetch);
    };
  }, [fetchNotificationsData]);

  // Derived counts
  const pendingRequestsForAdmin = useMemo(() => {
    if (!isAdminOrTrainer) return [];
    return materialRequests.filter((r) => r.status === "pending" || !r.status);
  }, [isAdminOrTrainer, materialRequests]);

  const fulfilledRequestsForOfficer = useMemo(() => {
    if (isAdminOrTrainer) return [];
    return materialRequests.filter((r) => r.status === "fulfilled");
  }, [isAdminOrTrainer, materialRequests]);

  const unreadConversationsForAdmin = useMemo(() => {
    if (!isAdminOrTrainer) return [];
    return adminConversations.filter((c) => (c.unreadCount || 0) > 0);
  }, [isAdminOrTrainer, adminConversations]);

  const unreadOfficerMessages = useMemo(() => {
    if (isAdminOrTrainer) return [];
    return officerMessages.filter((m) => m.senderRole === "admin" && !m.isRead);
  }, [isAdminOrTrainer, officerMessages]);

  const unreadCount = useMemo(() => {
    let count = 0;

    if (isAdminOrTrainer) {
      // Pending material requests that haven't been marked read
      pendingRequestsForAdmin.forEach((r) => {
        if (!readNotifications.includes(`mat_${r._id}`)) count += 1;
      });
      // Unread support conversations
      unreadConversationsForAdmin.forEach((c) => {
        if (!readNotifications.includes(`conv_${c.officerId}`)) count += 1;
      });
      // Broadcasts
      broadcasts.forEach((b) => {
        if (!readNotifications.includes(`bc_${b._id}`)) count += 1;
      });
    } else {
      // Diagnostic directives
      if (!isQuizCompleted) count += 1;
      if (!isInterviewCompleted) count += 1;

      // Fulfilled material requests
      fulfilledRequestsForOfficer.forEach((r) => {
        if (!readNotifications.includes(`mat_fulfilled_${r._id}`)) count += 1;
      });

      // Officer unread messages from admin
      unreadOfficerMessages.forEach((m) => {
        if (!readNotifications.includes(`msg_${m._id}`)) count += 1;
      });

      // Broadcasts
      broadcasts.forEach((b) => {
        if (!readNotifications.includes(`bc_${b._id}`)) count += 1;
      });
    }

    return count;
  }, [
    isAdminOrTrainer,
    pendingRequestsForAdmin,
    unreadConversationsForAdmin,
    broadcasts,
    readNotifications,
    isQuizCompleted,
    isInterviewCompleted,
    fulfilledRequestsForOfficer,
    unreadOfficerMessages,
  ]);

  const handleMarkAllRead = () => {
    const newIds = [...readNotifications];

    if (isAdminOrTrainer) {
      pendingRequestsForAdmin.forEach((r) => newIds.push(`mat_${r._id}`));
      unreadConversationsForAdmin.forEach((c) => newIds.push(`conv_${c.officerId}`));
      broadcasts.forEach((b) => newIds.push(`bc_${b._id}`));
    } else {
      fulfilledRequestsForOfficer.forEach((r) => newIds.push(`mat_fulfilled_${r._id}`));
      unreadOfficerMessages.forEach((m) => newIds.push(`msg_${m._id}`));
      broadcasts.forEach((b) => newIds.push(`bc_${b._id}`));
    }

    const uniqueIds = Array.from(new Set(newIds));
    setReadNotifications(uniqueIds);
    try {
      localStorage.setItem("sankhya_read_notifications", JSON.stringify(uniqueIds));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenMaterialTab = (requestId) => {
    if (requestId) {
      const updated = Array.from(new Set([...readNotifications, `mat_${requestId}`]));
      setReadNotifications(updated);
      try {
        localStorage.setItem("sankhya_read_notifications", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setIsOpen(false);
    navigate("/admin?tab=materials");
  };

  const handleOpenHelpdeskTab = (officerId) => {
    if (officerId) {
      const updated = Array.from(new Set([...readNotifications, `conv_${officerId}`]));
      setReadNotifications(updated);
      try {
        localStorage.setItem("sankhya_read_notifications", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setIsOpen(false);
    navigate("/admin?tab=communications");
  };

  const handleOpenOfficerMaterials = (requestId) => {
    if (requestId) {
      const updated = Array.from(new Set([...readNotifications, `mat_fulfilled_${requestId}`]));
      setReadNotifications(updated);
      try {
        localStorage.setItem("sankhya_read_notifications", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setIsOpen(false);
    navigate("/materials");
  };

  if (!userData) {
    return null;
  }

  return (
    <div ref={dropdownRef} className="relative select-none">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 sm:px-2.5 sm:py-2 rounded-2xl border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
            : unreadCount > 0
            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300/60 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 shadow-xs"
            : "bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 shadow-xs"
        }`}
        title={
          isAdminOrTrainer
            ? "Academy Notifications & Study Material Requisitions"
            : "Cadre Directives & Official Academy Announcements"
        }
        aria-label="Portal Notifications"
      >
        <div className="relative flex items-center justify-center">
          {isOpen ? (
            <BsBellFill size={16} className="text-white" />
          ) : (
            <BsBell
              size={16}
              className={unreadCount > 0 ? "animate-pulse" : ""}
            />
          )}

          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="absolute -top-1 -right-1.5 min-w-3.5 h-3.5 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs border border-white dark:border-slate-900">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </>
          )}
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 mt-2.5 w-[360px] sm:w-[460px] max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800/90 overflow-hidden z-[120] origin-top-right ring-1 ring-black/5"
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/90 dark:to-blue-950/40 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-700 text-white flex items-center justify-center shadow-md shrink-0">
                    {isAdminOrTrainer ? <BsShieldCheck size={16} /> : <BsBellFill size={16} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                        {isAdminOrTrainer
                          ? "Faculty & Secretariat Desk"
                          : "Cadre Notification Center"}
                      </h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300/40">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                      {isAdminOrTrainer
                        ? "User Study Material Requests • Live Inquiries"
                        : "Official Directives & Academy Circulars"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <HiX size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Items List */}
            <div className="max-h-[400px] overflow-y-auto p-4 space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800/80">
              
              {/* ADMIN: Study Material Requests from Users */}
              {isAdminOrTrainer && (
                <div className="pt-2 first:pt-0 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <FaBookOpen size={12} />
                      <span>Cadre Study Material Requisitions</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {pendingRequestsForAdmin.length} pending
                    </span>
                  </div>

                    {pendingRequestsForAdmin.length === 0 ? (
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center border border-slate-200/60 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          No pending study material requests from cadre officers.
                        </p>
                      </div>
                    ) : (
                      pendingRequestsForAdmin.map((req) => (
                        <div
                          key={req._id}
                          className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/5 via-blue-500/5 to-slate-500/5 border border-amber-300/60 dark:border-amber-700/60 hover:border-amber-500 transition-all space-y-2 relative"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                  req.urgency === "Urgent"
                                    ? "bg-rose-600 text-white"
                                    : req.urgency === "High"
                                    ? "bg-amber-500 text-white"
                                    : "bg-blue-600 text-white"
                                }`}
                              >
                                {req.urgency || "Normal"} Priority
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {req.domain || "Statistical Competency"}
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                              <FaClock size={10} />
                              {formatTimeAgo(req.createdAt)}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                              {req.topic}
                            </h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-1 line-clamp-2">
                              {req.description}
                            </p>
                          </div>

                          <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <FaUserTie size={11} className="text-blue-500" />
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {req.requesterName}
                              </span>
                              <span>• {req.requesterCadre || "Officer"}</span>
                            </div>

                            <button
                              onClick={() => handleOpenMaterialTab(req._id)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-bold shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <span>Fulfill & Dispatch</span>
                              <BsArrowRight size={10} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

              {/* ADMIN: Officer Live Helpdesk Inquiries */}
              {isAdminOrTrainer && (
                  <div className="pt-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <FaComments size={12} />
                        <span>Officer Support Inquiries</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {adminConversations.length} total
                      </span>
                    </div>

                    {adminConversations.length === 0 ? (
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center border border-slate-200/60 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          No active officer helpdesk messages.
                        </p>
                      </div>
                    ) : (
                      adminConversations.slice(0, 4).map((c) => (
                        <div
                          key={c.officerId}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 border border-slate-200/70 dark:border-slate-800 transition-colors space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {c.unreadCount > 0 && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                              )}
                              <span className="text-[11px] font-black text-slate-900 dark:text-white">
                                {c.officerName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({c.officerCadre || "Officer"})
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 shrink-0">
                              {formatTimeAgo(c.lastMessageAt)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
                            {c.lastMessage}
                          </p>

                          <div className="pt-1 flex items-center justify-end">
                            <button
                              onClick={() => handleOpenHelpdeskTab(c.officerId)}
                              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Reply in Helpdesk</span>
                              <BsArrowRight size={10} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

              {/* OFFICER: Fulfilled & Pending Study Material Requests */}
              {!isAdminOrTrainer && (
                  <div className="pt-2 first:pt-0 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <FaBookOpen size={12} />
                        <span>My Study Material Requests</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {materialRequests.length} total
                      </span>
                    </div>

                    {materialRequests.length === 0 ? (
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center border border-slate-200/60 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          No requisitions submitted yet. Request specialized study modules in the Materials Hub.
                        </p>
                      </div>
                    ) : (
                      materialRequests.slice(0, 4).map((req) => (
                        <div
                          key={req._id}
                          className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                            req.status === "fulfilled"
                              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/80"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {req.status === "fulfilled" ? (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  <FaCheckCircle size={9} />
                                  <span>Fulfilled & Dispatched</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[9.5px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  Under Secretariat Review
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {formatTimeAgo(req.createdAt)}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                              {req.dispatchedMaterialTitle || req.topic}
                            </h4>
                            {req.adminResponseNote && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic">
                                "{req.adminResponseNote}"
                              </p>
                            )}
                          </div>

                          {req.status === "fulfilled" && (
                            <div className="pt-1 flex items-center justify-end">
                              <button
                                onClick={() => handleOpenOfficerMaterials(req._id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <span>Access Study Material</span>
                                <BsArrowRight size={10} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

              {/* OFFICER: Mandatory Intake Directives */}
              {!isAdminOrTrainer && isIntakePending && (
                  <div className="pt-2 first:pt-0">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 border-2 border-amber-400/50 dark:border-amber-500/40 shadow-xs space-y-3 relative overflow-hidden">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                            Mandatory Cadre Directive
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[9.5px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                            Priority 1 Intake
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          Official NSSTA Secretariat
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug">
                          Cadre Diagnostic Baseline Intake
                        </h4>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                          <FaShieldAlt size={11} />
                          <span>Target Role: {targetRole}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        {!isQuizCompleted && (
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              startDiagnosticQuiz(navigate);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer group"
                          >
                            <FaTasks size={12} />
                            <span>Diagnostic Quiz</span>
                            <BsArrowRight
                              size={11}
                              className="group-hover:translate-x-0.5 transition-transform"
                            />
                          </button>
                        )}

                        {!isInterviewCompleted && (
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate("/interview?type=intake");
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer group"
                          >
                            <FaMicrophone size={12} />
                            <span>Oral Viva Voce</span>
                            <BsArrowRight
                              size={11}
                              className="group-hover:translate-x-0.5 transition-transform"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Broadcast Announcements */}
              {broadcasts.length > 0 && (
                  <div className="pt-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <FaBullhorn size={11} className="text-blue-600" />
                        <span>Admin Broadcast Messages</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {broadcasts.length} total
                      </span>
                    </div>

                    {broadcasts.map((b) => (
                      <div
                        key={b._id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 border border-slate-200/70 dark:border-slate-800 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            <span className="text-[11px] font-black text-blue-700 dark:text-blue-400 truncate max-w-[220px]">
                              {b.senderCadre || "NSSTA Secretariat"}
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 shrink-0">
                            {formatTimeAgo(b.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-wrap">
                          {b.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

              {/* Empty state when everything is caught up */}
              {unreadCount === 0 && (
                <div className="p-6 text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs border border-emerald-200/70 dark:border-emerald-800/70">
                    <BsCheckCircleFill size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      All Caught Up!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                      {isAdminOrTrainer
                        ? "There are no pending study material requests or unread officer communications requiring action."
                        : "All mandatory diagnostic assessments and circulars are up to date."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
