import React from "react";
import { IconPower, IconWater, IconFlood, IconAlert, IconBell, IconClose } from "./icons";

export interface AlertBannerProps {
  variant: "info" | "warning" | "danger";
  icon?: "power" | "water" | "flood" | "alert" | "bell";
  text: string;
  onDismiss: () => void;
}

export function AlertBanner({
  variant,
  icon = "alert",
  text,
  onDismiss,
}: AlertBannerProps) {
  const variantStyles = {
    info: "bg-[#003DA5]/10 text-[#003DA5] border border-[#003DA5]/20",
    warning: "bg-[#FF9500]/10 text-[#111827] border border-[#FF9500]/30",
    danger: "bg-[#E4002B]/10 text-[#E4002B] border border-[#E4002B]/20",
  };

  const iconColorStyles = {
    info: "text-[#003DA5]",
    warning: "text-[#FF9500]",
    danger: "text-[#E4002B]",
  };

  const IconMap = {
    power: IconPower,
    water: IconWater,
    flood: IconFlood,
    alert: IconAlert,
    bell: IconBell,
  };

  const IconComp = IconMap[icon] || IconAlert;

  return (
    <div
      role="region"
      aria-label="Active Community Alert"
      className={[
        "w-full p-4 rounded-[12px] flex items-center gap-3",
        variantStyles[variant],
      ].join(" ")}
    >
      <div className={["shrink-0", iconColorStyles[variant]].join(" ")}>
        <IconComp size={24} />
      </div>
      <p className="flex-1 text-[15px] font-medium leading-[1.5] text-[#111827] break-words">
        {text}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss alert"
        className="w-[48px] h-[48px] -m-2 shrink-0 flex items-center justify-center rounded-full text-[#6B7280] active:scale-[0.98] transition-transform duration-100 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5] focus-visible:outline-offset-2"
      >
        <IconClose size={20} />
      </button>
    </div>
  );
}
