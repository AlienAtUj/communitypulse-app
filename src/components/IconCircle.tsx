import React from "react";
import { IconProps } from "./icons";

export type IconCircleSize = "sm" | "md" | "lg";
export type IconCircleColor = "blue" | "green" | "amber" | "red" | "grey";

export interface IconCircleProps {
  size?: IconCircleSize;
  color?: IconCircleColor;
  icon: React.ComponentType<IconProps>;
  className?: string;
}

export function IconCircle({
  size = "md",
  color = "blue",
  icon: IconComponent,
  className = "",
}: IconCircleProps) {
  const sizeStyles: Record<IconCircleSize, { box: string; iconPx: number }> = {
    sm: { box: "w-[32px] h-[32px]", iconPx: 19 },
    md: { box: "w-[40px] h-[40px]", iconPx: 24 },
    lg: { box: "w-[48px] h-[48px]", iconPx: 29 },
  };

  const colorStyles: Record<IconCircleColor, string> = {
    blue: "bg-[#003DA5]/10 text-[#003DA5]",
    green: "bg-[#00A651]/10 text-[#00A651]",
    amber: "bg-[#FF9500]/10 text-[#FF9500]",
    red: "bg-[#E4002B]/10 text-[#E4002B]",
    grey: "bg-[#6B7280]/10 text-[#6B7280]",
  };

  const { box, iconPx } = sizeStyles[size];

  return (
    <div
      className={[
        "rounded-full flex items-center justify-center shrink-0",
        box,
        colorStyles[color],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <IconComponent size={iconPx} />
    </div>
  );
}
