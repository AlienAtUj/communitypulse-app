import React from "react";
import { HazardCategory, HAZARD_FILTER_OPTIONS } from "../lib/data";

export interface HazardFilterProps {
  selected: HazardCategory;
  onChange: (category: HazardCategory) => void;
  ariaLabel?: string;
}

export function HazardFilter({
  selected,
  onChange,
  ariaLabel = "Filter incidents by hazard type",
}: HazardFilterProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex items-center gap-1.5"
    >
      {HAZARD_FILTER_OPTIONS.map((option) => {
        const isActive = selected === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={[
              "min-h-[48px] flex-1 px-2.5 py-2 rounded-[12px] text-[12px] font-bold leading-tight text-center whitespace-nowrap transition-transform duration-100 active:scale-[0.98] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5]",
              isActive
                ? "bg-[#003DA5] text-[#FFFFFF]"
                : "bg-[#F7F8FA] text-[#111827] border border-[#E5E7EB]",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
