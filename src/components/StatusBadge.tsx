import React from "react";

export type BadgeStatus =
  | "reported"
  | "verified"
  | "assigned"
  | "resolved"
  | "critical"
  | "high"
  | "medium"
  | "open"
  | "closed"
  | "offer sent";

export interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const styleMap: Record<BadgeStatus, string> = {
    reported: "bg-[#FEF3C7] text-[#92400E]",
    verified: "bg-[#DBEAFE] text-[#1E40AF]",
    assigned: "bg-[#DBEAFE] text-[#1E40AF]",
    resolved: "bg-[#D1FAE5] text-[#065F46]",
    critical: "bg-[#FEE2E2] text-[#991B1B]",
    high: "bg-[#FEE2E2] text-[#991B1B]",
    medium: "bg-[#FEF3C7] text-[#92400E]",
    open: "bg-[#D1FAE5] text-[#065F46]",
    closed: "bg-[#F3F4F6] text-[#6B7280]",
    "offer sent": "bg-[#D1FAE5] text-[#065F46]",
  };

  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-[0.05em] leading-[1.4] whitespace-nowrap shrink-0",
        styleMap[status],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {status}
    </span>
  );
}
