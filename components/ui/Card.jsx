/**
 * Card Component - SUPERNOVA Theme
 *
 * Reusable card with variants:
 * - default: Standard glass card
 * - primary: Ember accent
 * - accent: Gold accent
 * - cool: Nebula blue accent
 *
 * Features:
 * - 3D tilt effect on hover (optional)
 * - Glow effects
 * - Multiple padding sizes
 */

import { useRef, forwardRef, useCallback } from "react";

const variants = {
  default: {
    base: "bg-[rgba(12,12,12,0.9)] border-[rgba(232,93,4,0.12)]",
    hover: "hover:border-[rgba(232,93,4,0.3)]",
    glow: "hover:shadow-[0_10px_25px_rgba(0,0,0,1),0_0_30px_rgba(232,93,4,0.2)]",
  },
  primary: {
    base: "bg-[rgba(232,93,4,0.08)] border-[rgba(232,93,4,0.25)]",
    hover: "hover:border-[#E85D04]",
    glow: "hover:shadow-[0_0_40px_rgba(232,93,4,0.35)]",
  },
  accent: {
    base: "bg-[rgba(250,163,7,0.08)] border-[rgba(250,163,7,0.25)]",
    hover: "hover:border-[#FAA307]",
    glow: "hover:shadow-[0_0_40px_rgba(250,163,7,0.35)]",
  },
  cool: {
    base: "bg-[rgba(76,201,240,0.08)] border-[rgba(76,201,240,0.25)]",
    hover: "hover:border-[#4CC9F0]",
    glow: "hover:shadow-[0_0_40px_rgba(76,201,240,0.35)]",
  },
  secondary: {
    base: "bg-[rgba(157,2,8,0.08)] border-[rgba(157,2,8,0.25)]",
    hover: "hover:border-[#9D0208]",
    glow: "hover:shadow-[0_0_40px_rgba(157,2,8,0.35)]",
  },
};

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card = forwardRef(function Card(
  {
    children,
    variant = "default",
    padding = "md",
    tilt = false,
    glow = true,
    interactive = false,
    className = "",
    as: Component = "div",
    ...props
  },
  ref,
) {
  const cardRef = useRef(null);
  const combinedRef = ref || cardRef;

  const handleMouseMove = useCallback(
    (e) => {
      if (!tilt) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      e.currentTarget.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(10px)`;
    },
    [tilt],
  );

  const handleMouseLeave = useCallback(
    (e) => {
      if (!tilt) return;
      e.currentTarget.style.transform = "";
    },
    [tilt],
  );

  const baseStyles = `
    relative overflow-hidden rounded-xl border backdrop-blur-sm
    transition-all duration-300 ease-out
    ${variants[variant].base}
    ${variants[variant].hover}
    ${glow ? variants[variant].glow : ""}
    ${paddings[padding]}
    ${interactive ? "cursor-pointer hover:-translate-y-1" : ""}
    ${tilt ? "transform-gpu" : ""}
    ${className}
  `;

  return (
    <Component
      ref={combinedRef}
      className={baseStyles}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}

      {/* Subtle corner glow effect */}
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 100% 0%, currentColor 0%, transparent 70%)`,
        }}
      />
    </Component>
  );
});

export default Card;
