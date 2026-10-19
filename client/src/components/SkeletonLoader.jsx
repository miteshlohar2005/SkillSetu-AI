export const SkeletonBox = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700/60 dark:to-slate-800 ${className}`}
  />
);

export const SkeletonText = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2.5 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="h-3.5 rounded-full animate-pulse bg-slate-200 dark:bg-slate-800"
        style={{ width: `${Math.max(40, 100 - i * 20)}%` }}
      />
    ))}
  </div>
);

export const DashboardSkeleton = () => {
  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8 animate-fadeIn">
      <div className="rounded-3xl p-8 bg-slate-200/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 animate-pulse flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-3 w-full max-w-xl">
          <div className="h-6 w-48 rounded-full bg-slate-300 dark:bg-slate-800" />
          <div className="h-10 w-3/4 rounded-2xl bg-slate-300 dark:bg-slate-800" />
          <div className="h-4 w-1/2 rounded-full bg-slate-300 dark:bg-slate-800" />
        </div>
        <div className="flex gap-3">
          <div className="h-11 w-36 rounded-2xl bg-slate-300 dark:bg-slate-800" />
          <div className="h-11 w-36 rounded-2xl bg-slate-300 dark:bg-slate-800" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="h-8 w-16 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <div className="h-4 w-40 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-7 w-72 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="h-8 w-28 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
        <div className="h-80 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse flex items-end justify-between p-6 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-xl bg-slate-300/80 dark:bg-slate-700/80 animate-pulse"
              style={{ height: `${30 + (i % 4) * 20}%` }}
            />
          ))}
        </div>
      </div>

      <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 h-64 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse mx-auto w-64" />
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-3">
              <div className="h-4 w-24 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-8 w-16 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CardGridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs"
        >
          <div className="flex justify-between items-center">
            <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="h-6 w-3/4 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-3 w-5/6 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const WorkflowHubSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
      <div className="lg:col-span-5 space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 animate-pulse"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-48 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
      <div className="lg:col-span-7 p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 animate-pulse">
        <div className="h-8 w-1/2 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-3/4 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-4">
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
        </div>
      </div>
    </div>
  );
};

export default {
  SkeletonBox,
  SkeletonText,
  DashboardSkeleton,
  CardGridSkeleton,
  WorkflowHubSkeleton,
};
