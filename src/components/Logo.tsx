import React from "react";

export type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";
export type LogoVariant = "icon" | "horizontal" | "stacked";

export interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
  showTagline?: boolean;
  onClick?: () => void;
}

const sizeMap = {
  xs: { img: "w-6 h-6", text: "text-base", sub: "text-[10px]" },
  sm: { img: "w-8 h-8", text: "text-lg", sub: "text-[11px]" },
  md: { img: "w-10 h-10", text: "text-xl", sub: "text-[12px]" },
  lg: { img: "w-16 h-16", text: "text-2xl", sub: "text-xs" },
  xl: { img: "w-24 h-24", text: "text-3xl", sub: "text-sm" },
};

export function Logo({
  size = "md",
  variant = "horizontal",
  className = "",
  showTagline = false,
  onClick,
}: LogoProps) {
  const s = sizeMap[size];

  const imageElement = (
    <img
      src="/logo.png"
      alt="CommunityPulse Logo"
      className={`${s.img} object-contain shrink-0 drop-shadow-sm select-none transition-transform duration-150 active:scale-95`}
      loading="eager"
    />
  );

  if (variant === "icon") {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center ${onClick ? "cursor-pointer" : ""} ${className}`}
      >
        {imageElement}
      </div>
    );
  }

  if (variant === "stacked") {
    return (
      <div
        onClick={onClick}
        className={`flex flex-col items-center text-center ${onClick ? "cursor-pointer" : ""} ${className}`}
      >
        <div className="relative mb-3">{imageElement}</div>
        <div className="flex flex-col items-center">
          <span className={`${s.text} font-black tracking-tight text-[#003DA5] leading-none`}>
            Community<span className="text-[#111827]">Pulse</span>
          </span>
          {showTagline && (
            <span className={`${s.sub} font-medium text-[#6B7280] mt-1 tracking-wide uppercase`}>
              Community Resilience Platform
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {imageElement}
      <div className="flex flex-col leading-tight min-w-0">
        <span className={`${s.text} font-black tracking-tight text-[#003DA5] leading-none`}>
          Community<span className="text-[#111827]">Pulse</span>
        </span>
        {showTagline && (
          <span className={`${s.sub} font-normal text-[#6B7280] leading-none mt-0.5 truncate`}>
            South Africa Resilience
          </span>
        )}
      </div>
    </div>
  );
}

