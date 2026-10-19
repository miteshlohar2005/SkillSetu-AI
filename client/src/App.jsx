import { useEffect, useState } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useDiagnostic } from "./context/DiagnosticContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CompetencyAssessment from "./pages/CompetencyAssessment";
import SkillGapAnalysis from "./pages/SkillGapAnalysis";
import JobReadinessReport from "./pages/JobReadinessReport";
import LearningPath from "./pages/LearningPath";
import Quizzes from "./pages/Quizzes";
import QuizPage from "./pages/QuizPage";
import Assignments from "./pages/Assignments";
import AssignmentDetails from "./pages/AssignmentDetails";
import MaterialsUpload from "./pages/MaterialsUpload";
import AdminDashboard from "./pages/AdminDashboard";
import ChatPage from "./pages/ChatPage";
import Community from "./pages/Community";
import Home from "./pages/Home";
import PrivacyPolicy from "./pages/Privacy";
import TermsOfService from "./pages/Terms";
import InterviewPage from "./pages/InterviewPage";
import InterviewHistory from "./pages/InterviewHistory";
import InterviewReport from "./pages/InterviewReport";
import Settings from "./pages/Settings";
import PortalDifference from "./pages/PortalDifference";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "./redux/userSlice";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "./components/ScrollToTop";
import ScrollProgressBar from "./components/ScrollProgressBar";
import LiveAdminChatWidget from "./components/LiveAdminChatWidget";
import { syncPageTranslation } from "./utils/translator";

export const ServerUrl = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

const ProtectedRoute = ({ children, loading, requireAdmin = false }) => {
  const userData = useSelector((state) => state.user.userData);
  const location = useLocation();
  const { isAssessmentAllowed, triggerLockedError } = useDiagnostic();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-bold text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating Session...</span>
        </div>
      </div>
    );
  }

  if (!userData) {
    return <Navigate to="/auth" replace />;
  }

  if (!userData.isProfileCompleted) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && userData.role !== "admin" && userData.role !== "trainer") {
    return <Navigate to="/" replace />;
  }

  if (userData.role === "trainer" && !["/admin", "/settings", "/chat", "/materials", "/dashboard"].includes(location.pathname)) {
    return <Navigate to="/admin" replace />;
  }

  if (!isAssessmentAllowed(location.pathname)) {
    triggerLockedError();
    return <Navigate to="/" replace />;
  }

  return children;
};

const PublicRoute = ({ children, loading }) => {
  const userData = useSelector((state) => state.user.userData);
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-bold text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating Session...</span>
        </div>
      </div>
    );
  }

  if (userData && !userData.isProfileCompleted) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

const AuthRoute = ({ loading }) => {
  const userData = useSelector((state) => state.user.userData);
  const { isIntakePending } = useDiagnostic();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-bold text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating Session...</span>
        </div>
      </div>
    );
  }

  if (userData && userData.isProfileCompleted) {
    if (userData.role === "trainer" || userData.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (isIntakePending) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Auth />;
};

const DiagnosticQuizLauncher = () => {
  const navigate = useNavigate();
  const { startDiagnosticQuiz } = useDiagnostic();

  useEffect(() => {
    startDiagnosticQuiz(navigate);
  }, [navigate, startDiagnosticQuiz]);

  return (
    <div className="h-screen flex items-center justify-center bg-[#F2F1EE] text-[#101014] font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#101014] border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#101014]/70">
          Initializing Cadre Diagnostic Assessment...
        </span>
      </div>
    </div>
  );
};

const QuizEntryRedirect = () => {
  const { isIntakePending, startDiagnosticQuiz } = useDiagnostic();
  const navigate = useNavigate();

  useEffect(() => {
    if (isIntakePending) {
      startDiagnosticQuiz(navigate);
    } else {
      navigate("/quizzes", { replace: true });
    }
  }, [isIntakePending, navigate, startDiagnosticQuiz]);

  return (
    <div className="h-screen flex items-center justify-center bg-[#F2F1EE] text-[#101014] font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#101014] border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#101014]/70">
          Directing to Assessment...
        </span>
      </div>
    </div>
  );
};

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    const currentLang = localStorage.getItem("sankhya_lang");
    if (currentLang === "hi") {
      const timer = setTimeout(() => {
        syncPageTranslation("hi");
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(ServerUrl + "/api/user/current-user", {
          withCredentials: true,
        });
        if (result.data) {
          dispatch(setUserData(result.data));
        }
      } catch (error) {
        // If 401 Unauthorized, the user simply has no active session cookie.
        // Silently clear user data without noisy console dumps.
        if (error.response?.status !== 401) {
          console.warn("User session check failed:", error.message);
        }
        dispatch(setUserData(null));
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [dispatch]);

  return (
    <>
      <ScrollToTop />
      <Toaster position="top-center" reverseOrder={false} />
      <ScrollProgressBar />
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute loading={loading}>
              <Home />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute loading={loading}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/competencies"
          element={
            <ProtectedRoute loading={loading}>
              <CompetencyAssessment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/skill-gaps"
          element={
            <ProtectedRoute loading={loading}>
              <SkillGapAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/skill-gap-analysis"
          element={
            <ProtectedRoute loading={loading}>
              <SkillGapAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-readiness"
          element={
            <ProtectedRoute loading={loading}>
              <JobReadinessReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning-path"
          element={
            <ProtectedRoute loading={loading}>
              <LearningPath />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes"
          element={
            <ProtectedRoute loading={loading}>
              <Quizzes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diagnostic-quiz"
          element={
            <ProtectedRoute loading={loading}>
              <DiagnosticQuizLauncher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/diagnostic"
          element={
            <ProtectedRoute loading={loading}>
              <DiagnosticQuizLauncher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute loading={loading}>
              <QuizEntryRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:id"
          element={
            <ProtectedRoute loading={loading}>
              <QuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute loading={loading}>
              <Assignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments/:id"
          element={
            <ProtectedRoute loading={loading}>
              <AssignmentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <ProtectedRoute loading={loading}>
              <MaterialsUpload initialTab="material-request" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mcq-create"
          element={
            <ProtectedRoute loading={loading}>
              <MaterialsUpload initialTab="mcq-create" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute loading={loading}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute loading={loading}>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <PublicRoute loading={loading}>
              <Community />
            </PublicRoute>
          }
        />

        <Route path="/auth" element={<AuthRoute loading={loading} />} />

        <Route
          path="/interview"
          element={
            <ProtectedRoute loading={loading}>
              <InterviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute loading={loading}>
              <InterviewHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/:id"
          element={
            <ProtectedRoute loading={loading}>
              <InterviewReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute loading={loading}>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/terms"
          element={
            <PublicRoute loading={loading}>
              <TermsOfService />
            </PublicRoute>
          }
        />
        <Route
          path="/privacy"
          element={
            <PublicRoute loading={loading}>
              <PrivacyPolicy />
            </PublicRoute>
          }
        />
        <Route
          path="/welcome"
          element={
            <PublicRoute loading={loading}>
              <Home />
            </PublicRoute>
          }
        />
        <Route
          path="/portal-comparison"
          element={
            <PublicRoute loading={loading}>
              <PortalDifference />
            </PublicRoute>
          }
        />
        <Route
          path="/portal-difference"
          element={
            <PublicRoute loading={loading}>
              <PortalDifference />
            </PublicRoute>
          }
        />

        <Route
          path="*"
          element={
            <PublicRoute loading={loading}>
              <Navigate to="/" replace />
            </PublicRoute>
          }
        />
      </Routes>
      {userData && userData.isProfileCompleted && userData.role !== "trainer" && <LiveAdminChatWidget />}
    </>
  );
};

export default App;
