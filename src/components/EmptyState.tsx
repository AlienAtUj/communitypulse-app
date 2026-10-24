import React from "react";
import { Button } from "./Button";
import { IconProps } from "./icons";

export interface EmptyStateProps {
  icon: React.ComponentType<IconProps>;
  heading: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  heading,
  body,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const IconComp = icon;

  return (
    <div className="py-10 px-5 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-center text-[#003DA5] mb-3.5 shadow-sm">
        <IconComp size={24} />
      </div>
      <h3 className="text-[17px] font-bold leading-[1.4] text-[#111827] mb-1">
        {heading}
      </h3>
      <p className="text-[14px] font-normal leading-[1.5] text-[#6B7280] max-w-[280px] break-words">
        {body}
      </p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
