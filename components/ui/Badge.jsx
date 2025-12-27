/**
 * Badge Component - SUPERNOVA Theme
 *
 * Reusable badge/chip with color variants
 *
 * Variants:
 * - primary: Ember orange
 * - secondary: Crimson
 * - accent: Gold
 * - cool: Nebula blue
 * - ember: Warm orange
 * - success/warning/error/info: Status colors
 */

import { forwardRef } from "react";

const variants = {
  primary:
    "bg-[rgba(232,93,4,0.12)] text-[#E85D04] border-[rgba(232,93,4,0.2)]",
  secondary:
    "bg-[rgba(157,2,8,0.12)] text-[#DC2626] border-[rgba(157,2,8,0.2)]",
  accent:
    "bg-[rgba(250,163,7,0.12)] text-[#FAA307] border-[rgba(250,163,7,0.2)]",
  cool: "bg-[rgba(76,201,240,0.12)] text-[#4CC9F0] border-[rgba(76,201,240,0.2)]",
  ember:
    "bg-[rgba(244,140,6,0.12)] text-[#F48C06] border-[rgba(244,140,6,0.2)]",
  success:
    "bg-[rgba(16,185,129,0.12)] text-[#10B981] border-[rgba(16,185,129,0.2)]",
  warning:
    "bg-[rgba(250,163,7,0.12)] text-[#FAA307] border-[rgba(250,163,7,0.2)]",
  error:
    "bg-[rgba(239,68,68,0.12)] text-[#EF4444] border-[rgba(239,68,68,0.2)]",
  info: "bg-[rgba(76,201,240,0.12)] text-[#4CC9F0] border-[rgba(76,201,240,0.2)]",
  neutral:
    "bg-[rgba(163,163,163,0.12)] text-[#A3A3A3] border-[rgba(163,163,163,0.2)]",
};

const sizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export const Badge = forwardRef(function Badge(
  {
    children,
    variant = "primary",
    size = "md",
    icon,
    pulse = false,
    className = "",
    ...props
  },
  ref,
) {
  return (
    <span
      ref={ref}
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {pulse && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{
            backgroundColor: "currentColor",
            boxShadow: "0 0 8px currentColor",
          }}
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
});

export default Badge;
