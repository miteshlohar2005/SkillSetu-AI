import { BsShieldExclamation, BsExclamationTriangleFill } from "react-icons/bs";
import { FaLock } from "react-icons/fa";

const ExamProctoringModal = ({
  isOpen,
  tabSwitchCount,
  maxAllowed = 5,
  onAcknowledge,
}) => {
  if (!isOpen) return null;

  const isCritical = tabSwitchCount >= maxAllowed - 1;
  const isFinal = tabSwitchCount >= maxAllowed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-500/80 shadow-2xl shadow-rose-950/40 p-6 sm:p-8 space-y-6 animate-scaleUp">

        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 animate-pulse" />

        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 shrink-0">
            <BsShieldExclamation size={28} className="animate-bounce" />
          </div>

          <div className="space-y-1 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <FaLock size={9} />
              <span>Proctoring Security Violation</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              Tab Change Detected!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Navigation away from the assessment window is strictly logged.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">
              Tab Switch Count
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 flex items-baseline gap-1.5 mt-0.5">
              <span>{tabSwitchCount}</span>
              <span className="text-xs font-semibold text-slate-400">
                / {maxAllowed} maximum allowed
              </span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                isFinal
                  ? "bg-red-600 text-white animate-pulse"
                  : isCritical
                  ? "bg-amber-500 text-white"
                  : "bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
              }`}
            >
              {isFinal
                ? "Auto-Submitting..."
                : isCritical
                ? "Final Warning!"
                : `Warning #${tabSwitchCount}`}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-2">
            <BsExclamationTriangleFill
              className="text-amber-500 shrink-0 mt-0.5"
              size={14}
            />
            <p className="leading-relaxed">
              You navigated away from the exam tab. In accordance with examination guidelines, all tab changes, window unfocus events, and clipboard attempts are audited.
            </p>
          </div>
          {tabSwitchCount < maxAllowed ? (
            <p className="text-rose-600 dark:text-rose-400 font-bold pl-5">
              ⚠️ You have {maxAllowed - tabSwitchCount} warning
              {maxAllowed - tabSwitchCount === 1 ? "" : "s"} remaining before your assessment is automatically submitted.
            </p>
          ) : (
            <p className="text-rose-600 dark:text-rose-400 font-bold pl-5">
              🚨 Maximum tab switches reached. Your assessment is now being automatically evaluated.
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onAcknowledge}
            className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>
              {isFinal
                ? "Maximum Tab Violations (5) Reached — Return to Quizzes"
                : "I Understand & Resume Assessment"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamProctoringModal;
