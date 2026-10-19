import React from "react";
import { Link } from "react-router-dom";

/**
 * ArtCraft Design System Reusable Components
 * Specifications:
 * - Primary: #101014
 * - Secondary/Accent: #2D81FF
 * - Border/Tertiary: #E5E7EB
 * - Neutral/Background: #F2F1EE
 * - Surface: #FFFFFF
 * - Error: #D64545
 * - Typography: Archivo (display), Inter (sans), Geist Mono (mono), Instrument Serif (serif)
 */

export const ArtButton = ({
  children,
  variant = "primary", // "primary" | "secondary" | "outline" | "danger" | "ghost"
  size = "md", // "sm" | "md" | "lg"
  icon: Icon,
  iconRight: IconRight,
  isLoading = false,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-mono font-bold uppercase tracking-[0.06em] text-[11px] rounded-none transition-all duration-150 cursor-pointer select-none disabled:opacity-45 disabled:cursor-not-allowed text-center";

  const sizeClasses = {
    sm: "h-9 px-3.5 py-1.5 gap-1.5",
    md: "h-12 px-6 py-3.5 gap-2",
    lg: "h-14 px-8 py-4 gap-2.5 text-xs",
  }[size] || "h-12 px-6 py-3.5 gap-2";

  const variantClasses = {
    primary:
      "bg-[#101014] text-[#F2F1EE] border border-[#101014] hover:bg-[#2D81FF] hover:border-[#2D81FF] hover:text-white active:bg-[#1a68d4]",
    secondary:
      "bg-[#F2F1EE] text-[#101014] border border-[#E5E7EB] hover:bg-white hover:border-[#101014] hover:text-[#101014] active:bg-[#e8e7e3]",
    outline:
      "bg-transparent text-[#101014] border border-[#101014] hover:bg-[#101014] hover:text-[#F2F1EE] active:bg-[#22222a]",
    accent:
      "bg-[#2D81FF] text-white border border-[#2D81FF] hover:bg-[#101014] hover:border-[#101014] hover:text-[#F2F1EE] active:bg-[#000000]",
    danger:
      "bg-[#D64545] text-white border border-[#D64545] hover:bg-[#101014] hover:border-[#101014] hover:text-white active:bg-black",
    ghost:
      "bg-transparent text-[#101014] border border-transparent hover:bg-[#E5E7EB]/60 hover:text-[#101014]",
  }[variant] || "bg-[#101014] text-[#F2F1EE] border border-[#101014]";

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="shrink-0 text-sm" />
      ) : null}
      <span>{children}</span>
      {IconRight && !isLoading && <IconRight className="shrink-0 text-sm" />}
    </button>
  );
};

export const ArtCard = ({
  children,
  variant = "surface", // "surface" (#FFFFFF) | "neutral" (#F2F1EE)
  padding = "md", // "sm" | "md" | "lg" | "none"
  hoverEffect = false,
  className = "",
  onClick,
  ...props
}) => {
  const bgClass = variant === "neutral" ? "bg-[#F2F1EE]" : "bg-white";
  const padClass = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }[padding] || "p-6";

  const hoverClass = hoverEffect
    ? "transition-all duration-150 hover:border-[#101014] hover:shadow-none cursor-pointer"
    : "";

  return (
    <div
      onClick={onClick}
      className={`rounded-[4px] border border-[#E5E7EB] text-[#101014] ${bgClass} ${padClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const ArtInput = React.forwardRef(
  (
    {
      label,
      error,
      hint,
      icon: Icon,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#101014]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3.5 text-[#101014]/60 pointer-events-none">
              <Icon size={16} />
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-white text-[#101014] border border-[#E5E7EB] rounded-none px-4 py-3 text-sm font-sans placeholder-[#101014]/40 outline-none transition-colors duration-150 focus:border-[#2D81FF] disabled:bg-[#F2F1EE] disabled:opacity-60 ${
              Icon ? "pl-10" : ""
            } ${error ? "border-[#D64545] focus:border-[#D64545]" : ""} ${className}`}
            {...props}
          />
        </div>
        {hint && !error && (
          <p className="text-xs text-[#101014]/60">{hint}</p>
        )}
        {error && (
          <p className="text-xs font-mono font-medium text-[#D64545]">{error}</p>
        )}
      </div>
    );
  }
);
ArtInput.displayName = "ArtInput";

export const ArtSelect = React.forwardRef(
  (
    {
      label,
      error,
      options = [],
      children,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#101014]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full bg-white text-[#101014] border border-[#E5E7EB] rounded-none px-4 py-3 text-sm font-sans outline-none transition-colors duration-150 focus:border-[#2D81FF] cursor-pointer disabled:bg-[#F2F1EE] ${
            error ? "border-[#D64545]" : ""
          } ${className}`}
          {...props}
        >
          {children ||
            options.map((opt) => (
              <option
                key={typeof opt === "string" ? opt : opt.value}
                value={typeof opt === "string" ? opt : opt.value}
              >
                {typeof opt === "string" ? opt : opt.label}
              </option>
            ))}
        </select>
        {error && (
          <p className="text-xs font-mono font-medium text-[#D64545]">{error}</p>
        )}
      </div>
    );
  }
);
ArtSelect.displayName = "ArtSelect";

export const ArtChip = ({
  children,
  active = false,
  variant = "default", // "default" | "accent" | "success" | "warning" | "danger"
  onClick,
  className = "",
}) => {
  const variantStyles = {
    default: active
      ? "bg-[#101014] text-[#F2F1EE] border-[#101014]"
      : "bg-[#F2F1EE] text-[#101014] border-[#E5E7EB] hover:border-[#101014]",
    accent: "bg-[#2D81FF]/10 text-[#2D81FF] border-[#2D81FF]/30",
    success: "bg-[#101014] text-[#F2F1EE] border-[#101014]",
    warning: "bg-amber-100/70 text-amber-900 border-amber-300",
    danger: "bg-[#D64545]/10 text-[#D64545] border-[#D64545]/30",
  }[variant];

  const clickableClass = onClick ? "cursor-pointer select-none" : "";

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-sans font-semibold tracking-[0.08em] uppercase border transition-colors ${variantStyles} ${clickableClass} ${className}`}
    >
      {children}
    </span>
  );
};

export const ArtMetricCard = ({
  label,
  value,
  subvalue,
  icon: Icon,
  accent = false,
  className = "",
}) => {
  return (
    <ArtCard
      padding="md"
      className={`relative overflow-hidden ${
        accent ? "border-[#2D81FF] border-l-4" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#101014]/70 block">
            {label}
          </span>
          <div className="mt-2 font-display text-3xl font-bold tracking-tight text-[#101014]">
            {value}
          </div>
          {subvalue && (
            <div className="mt-1 text-xs text-[#101014]/60 font-sans">
              {subvalue}
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-[4px] bg-[#F2F1EE] border border-[#E5E7EB] flex items-center justify-center text-[#101014] shrink-0">
            <Icon size={18} />
          </div>
        )}
      </div>
    </ArtCard>
  );
};

export const ArtSectionHeader = ({
  overline,
  title,
  subtitle,
  actions,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E5E7EB] ${className}`}
    >
      <div>
        {overline && (
          <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#2D81FF] mb-1">
            {overline}
          </span>
        )}
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#101014]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-[#101014]/70 font-sans max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
};

export const ArtEmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`art-card text-center py-12 px-6 flex flex-col items-center justify-center bg-white border border-[#E5E7EB] rounded-[4px] ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-[4px] bg-[#F2F1EE] border border-[#E5E7EB] flex items-center justify-center text-[#101014] mb-4">
          <Icon size={22} />
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-[#101014]">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-[#101014]/70 max-w-md font-sans">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export const ArtBadge = ({ children, variant = "neutral", className = "" }) => {
  const styles = {
    neutral: "bg-[#F2F1EE] text-[#101014] border-[#E5E7EB]",
    primary: "bg-[#101014] text-[#F2F1EE] border-[#101014]",
    accent: "bg-[#2D81FF] text-white border-[#2D81FF]",
    danger: "bg-[#D64545] text-white border-[#D64545]",
    outline: "bg-transparent text-[#101014] border-[#101014]",
  }[variant] || "bg-[#F2F1EE] text-[#101014] border-[#E5E7EB]";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] border rounded-none ${styles} ${className}`}
    >
      {children}
    </span>
  );
};
