import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const Timer = ({ timeLeft = 60, totalTime = 60, className = "" }) => {
  const validTotal = typeof totalTime === "number" && totalTime > 0 ? totalTime : 60;
  const validTime = typeof timeLeft === "number" && !isNaN(timeLeft) ? Math.max(0, timeLeft) : 0;
  const percentage = Math.min(100, Math.max(0, (validTime / validTotal) * 100));

  const pathColor =
    validTime <= 10 ? "#ef4444" : validTime <= 25 ? "#f59e0b" : "#10b981";

  return (
    <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 transition-all ${className}`}>
      <CircularProgressbar
        value={percentage}
        text={`${validTime}s`}
        styles={buildStyles({
          textSize: "28px",
          pathColor: pathColor,
          textColor: validTime <= 10 ? "#ef4444" : "#10b981",
          trailColor: "currentColor",
          pathTransitionDuration: 0.5,
        })}
        className="text-slate-200 dark:text-slate-700"
      />
    </div>
  );
};

export default Timer;

