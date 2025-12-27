/**
 * Button Component - SUPERNOVA Theme
 *
 * Reusable button with variants:
 * - primary: Fiery gradient with glow
 * - secondary: Ghost with border
 * - cool: Nebula blue accent
 * - ghost: Minimal styling
 *
 * Features:
 * - Magnetic hover effect (optional)
 * - Size variants (sm, md, lg, xl)
 * - Loading state
 * - Icon support
 */

import { useRef, forwardRef } from "react";
import Link from "next/link";

const variants = {
  primary: {
    base: "bg-gradient-to-br from-[#E85D04] to-[#C04A03] text-white shadow-[0_0_30px_rgba(232,93,4,0.35)]",
    hover:
      "hover:from-[#F48C06] hover:to-[#E85D04] hover:shadow-[0_0_50px_rgba(232,93,4,0.5)]",
  },
  secondary: {
    base: "bg-transparent text-[var(--color-text-primary)] border border-[rgba(250,163,7,0.3)]",
    hover:
      "hover:border-[#E85D04] hover:text-[#E85D04] hover:bg-[rgba(232,93,4,0.08)]",
  },
  cool: {
    base: "bg-gradient-to-br from-[#4CC9F0] to-[#4895EF] text-[#000] shadow-[0_0_30px_rgba(76,201,240,0.35)]",
    hover: "hover:shadow-[0_0_50px_rgba(76,201,240,0.5)]",
  },
  ghost: {
    base: "bg-transparent text-[var(--color-text-secondary)]",
    hover: "hover:text-[#E85D04] hover:bg-[rgba(232,93,4,0.08)]",
  },
};

const sizes = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
  xl: "px-8 py-4 text-lg gap-3",
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    magnetic = false,
    loading = false,
    disabled = false,
    href,
    icon,
    iconPosition = "right",
    className = "",
    ...props
  },
  ref,
) {
  const buttonRef = useRef(null);
  const combinedRef = ref || buttonRef;

  const handleMouseMove = (e) => {
    if (!magnetic || disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.2;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.2;
    e.currentTarget.style.transform = `translate(${x}px, ${y}px) translateY(-2px)`;
  };

  const handleMouseLeave = (e) => {
    if (!magnetic) return;
    e.currentTarget.style.transform = "";
  };

  const baseStyles = `
    inline-flex items-center justify-center font-semibold rounded-lg
    transition-all duration-300 ease-out
    disabled:opacity-50 disabled:cursor-not-allowed
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E85D04]
    ${magnetic ? "hover:-translate-y-0.5" : "hover:-translate-y-0.5"}
    ${variants[variant].base}
    ${variants[variant].hover}
    ${sizes[size]}
    ${className}
  `;

  const content = (
    <>
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && iconPosition === "left" && (
        <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === "right" && (
        <span className="shrink-0 transition-transform group-hover:translate-x-1">
          {icon}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        ref={combinedRef}
        className={`group ${baseStyles}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={combinedRef}
      className={`group ${baseStyles}`}
      disabled={disabled || loading}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {content}
    </button>
  );
});

export default Button;
