import React from "react";

export interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

export function Card({ children, onClick, className = "", ariaLabel }: CardProps) {
  const baseClasses =
    "bg-[#FFFFFF] rounded-2xl p-5 border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-left w-full";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={[
          baseClasses,
          "active:scale-[0.99] transition-transform duration-100 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5] focus-visible:outline-offset-2 block",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={[baseClasses, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
