import React from "react";
import { Incident, IncidentType, INCIDENT_TYPE_LABELS } from "../lib/data";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";
import { CategoryVisual } from "./CategoryVisual";
import {
  IconPower,
  IconWater,
  IconFood,
  IconRoad,
  IconFlood,
  IconFire,
  IconArrowRight,
  IconProps,
} from "./icons";

export interface IncidentCardProps {
  incident: Incident;
  onClick: (incident: Incident) => void;
}

export const INCIDENT_ICONS: Record<IncidentType, React.ComponentType<IconProps>> = {
  power: IconPower,
  water: IconWater,
  food: IconFood,
  road: IconRoad,
  flood: IconFlood,
  fire: IconFire,
};

export const INCIDENT_COLORS = {
  power: "amber",
  water: "blue",
  food: "green",
  road: "amber",
  flood: "red",
  fire: "red",
} as const;

export function IncidentCard({ incident, onClick }: IncidentCardProps) {
  const typeLabel = INCIDENT_TYPE_LABELS[incident.type];

  return (
    <Card
      onClick={() => onClick(incident)}
      ariaLabel={`${typeLabel} at ${incident.location}, status ${incident.status}. View details`}
      className={
        incident.priority === "critical" ? "border-l-4 border-l-[#E4002B]" : ""
      }
    >
      <div className="flex items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Real Photo Thumbnail */}
          <CategoryVisual category={incident.type} variant="thumbnail" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h3 className="text-[16px] font-bold leading-[1.4] text-[#111827] truncate">
                {typeLabel}
              </h3>
              <StatusBadge status={incident.status} />
            </div>
            <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] truncate">
              {incident.location} · {incident.time}
            </p>
            <p className="text-[12px] font-medium leading-[1.4] text-[#003DA5] mt-1 truncate">
              {incident.confirmations} neighbours reported · {incident.affected} households
              {incident.eta ? ` · ETA ${incident.eta}` : ""}
            </p>
          </div>
        </div>
        <div className="text-[#003DA5] shrink-0 pl-1">
          <IconArrowRight size={18} />
        </div>
      </div>
    </Card>
  );
}
