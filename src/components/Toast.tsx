import React from "react";
import { IconCheck, IconAlert, IconBell } from "./icons";

export interface ToastProps {
  variant: "success" | "error" | "info";
  message: string;
  onDismiss?: () => void;
}

export function Toast({ variant, message, onDismiss }: ToastProps) {
  const variantStyles = {
    success: "bg-[#00A651] text-[#FFFFFF]",
    error: "bg-[#E4002B] text-[#FFFFFF]",
    info: "bg-[#003DA5] text-[#FFFFFF]",
  };

  const IconMap = {
    success: IconCheck,
    error: IconAlert,
    info: IconBell,
  };

  const IconComp = IconMap[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDismiss}
      className="fixed bottom-[84px] left-0 right-0 z-[60] px-5 pointer-events-none flex justify-center"
    >
      <div
        className={[
          "pointer-events-auto w-full max-w-[380px] rounded-[12px] py-3 px-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center gap-3 cursor-pointer",
          variantStyles[variant],
        ].join(" ")}
      >
        <div className="shrink-0">
          <IconComp size={20} />
        </div>
        <span className="text-[15px] font-medium leading-[1.5] break-words">
          {message}
        </span>
      </div>
    </div>
  );
}
