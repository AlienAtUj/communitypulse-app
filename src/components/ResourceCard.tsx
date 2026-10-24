import React from "react";
import { Resource } from "../lib/data";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";
import { CategoryVisual } from "./CategoryVisual";
import { IconArrowRight } from "./icons";

export interface ResourceCardProps {
  resource: Resource;
  onClick: (resource: Resource) => void;
}

export function ResourceCard({ resource, onClick }: ResourceCardProps) {
  const parts = resource.name.split(" — ");
  const title = parts[0] || resource.name;
  const place = parts[1] || resource.name;

  return (
    <Card
      onClick={() => onClick(resource)}
      ariaLabel={`${resource.name}, ${resource.distance}, ${resource.hours}`}
    >
      <div className="flex items-center justify-between gap-3.5">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          {/* Real Photo Thumbnail */}
          <CategoryVisual category={resource.type} variant="thumbnail" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-[16px] font-bold leading-[1.4] text-[#111827] break-words">
                {title}
              </h3>
              <StatusBadge status={resource.status} />
            </div>
            <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] mb-1 break-words">
              {place} · {resource.distance}
            </p>
            <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] break-words">
              {resource.hours} · updated {resource.updated}
            </p>
          </div>
        </div>
        <div className="text-[#6B7280] shrink-0 pl-1">
          <IconArrowRight size={18} />
        </div>
      </div>
    </Card>
  );
}
