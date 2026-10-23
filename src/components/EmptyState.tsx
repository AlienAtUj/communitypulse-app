import React from "react";
import { IconCircle } from "./IconCircle";
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
  return (
    <div className="py-12 px-5 flex flex-col items-center justify-center text-center">
      <IconCircle size="lg" color="grey" icon={icon} className="mb-3" />
      <h3 className="text-[16px] font-bold leading-[1.4] text-[#111827] mb-1">
        {heading}
      </h3>
      <p className="text-[15px] font-normal leading-[1.5] text-[#6B7280] max-w-[280px] break-words">
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
