import React from "react";

export interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <h2
      className={[
        "text-[13px] font-medium uppercase tracking-[0.05em] leading-[1.4] text-[#6B7280] mb-[12px]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </h2>
  );
}
