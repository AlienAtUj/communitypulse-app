import React from "react";
import { Incident, INCIDENT_TYPE_LABELS } from "../lib/data";
import { BottomSheet } from "../components/BottomSheet";
import { IconCircle } from "../components/IconCircle";
import { StatusBadge } from "../components/StatusBadge";
import { SectionLabel } from "../components/SectionLabel";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { INCIDENT_ICONS, INCIDENT_COLORS } from "../components/IncidentCard";
import { IconCheck, IconTruck } from "../components/icons";

export interface IncidentDetailSheetProps {
  incident: Incident | null;
  onClose: () => void;
  onFindHelp: () => void;
  onConfirmResolved: (id: string) => void;
}

const TIMELINE_STEPS: {
  key: Incident["status"];
  title: string;
  getCaption: (inc: Incident) => string;
}[] = [
  {
    key: "reported",
    title: "Reported",
    getCaption: (inc) => `Logged at ${inc.time} in ${inc.location}`,
  },
  {
    key: "verified",
    title: "Verified",
    getCaption: (inc) =>
      inc.confirmations > 0
        ? `Confirmed by ${inc.confirmations} neighbours`
        : "Waiting for neighbour confirmations",
  },
  {
    key: "assigned",
    title: "Assigned",
    getCaption: (inc) =>
      inc.eta
        ? `Municipal response team dispatched · ETA ${inc.eta}`
        : "Awaiting municipal response dispatch",
  },
  {
    key: "resolved",
    title: "Resolved",
    getCaption: (inc) =>
      inc.status === "resolved"
        ? "Service restored and confirmed by community"
        : "Pending confirmation of service restoration",
  },
];

const STATUS_INDEX: Record<Incident["status"], number> = {
  reported: 0,
  verified: 1,
  assigned: 2,
  resolved: 3,
};

export function IncidentDetailSheet({
  incident,
  onClose,
  onFindHelp,
  onConfirmResolved,
}: IncidentDetailSheetProps) {
  if (!incident) return null;

  const IconComp = INCIDENT_ICONS[incident.type];
  const color = INCIDENT_COLORS[incident.type];
  const typeLabel = INCIDENT_TYPE_LABELS[incident.type];
  const currentIndex = STATUS_INDEX[incident.status];

  return (
    <BottomSheet
      isOpen={Boolean(incident)}
      onClose={onClose}
      title={`${typeLabel} details`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <IconCircle size="md" color={color} icon={IconComp} />
          <h2 className="text-[20px] font-bold leading-[1.3] text-[#111827] break-words">
            {typeLabel}
          </h2>
        </div>
        <StatusBadge status={incident.status} />
      </div>

      {/* Meta */}
      <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] mb-4 break-words">
        {incident.location} · Reported {incident.time} · {incident.confirmations} neighbours confirmed
      </p>

      {/* Description */}
      {incident.description && (
        <p className="text-[15px] font-normal leading-[1.5] text-[#111827] mb-5 break-words">
          {incident.description}
        </p>
      )}

      {/* Critical Facilities */}
      {incident.facilities && incident.facilities.length > 0 && (
        <div className="mb-6">
          <SectionLabel>CRITICAL FACILITIES</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {incident.facilities.map((facility) => (
              <span
                key={facility}
                className="rounded-full bg-[#F7F8FA] border border-[#E5E7EB] px-3 py-1 text-[13px] font-medium leading-[1.4] text-[#111827]"
              >
                {facility}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Status Timeline */}
      <div className="mb-6">
        <SectionLabel>STATUS</SectionLabel>
        <div className="flex flex-col">
          {TIMELINE_STEPS.map((step, idx) => {
            const isCompleted =
              incident.status === "resolved" ? true : idx < currentIndex;
            const isActive =
              incident.status !== "resolved" && idx === currentIndex;
            const isLast = idx === TIMELINE_STEPS.length - 1;

            return (
              <div key={step.key} className="flex items-stretch gap-3">
                {/* Left column: Circle + vertical connector */}
                <div className="flex flex-col items-center">
                  {isCompleted ? (
                    <div className="w-[24px] h-[24px] rounded-full bg-[#00A651] text-[#FFFFFF] flex items-center justify-center shrink-0">
                      <IconCheck size={14} />
                    </div>
                  ) : isActive ? (
                    <div className="relative w-[24px] h-[24px] flex items-center justify-center shrink-0">
                      <span className="absolute inset-0 rounded-full bg-[#003DA5]/25 animate-pulse" />
                      <div className="relative w-[16px] h-[16px] rounded-full bg-[#003DA5]" />
                    </div>
                  ) : (
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#E5E7EB] bg-[#FFFFFF] shrink-0" />
                  )}

                  {!isLast && (
                    <div
                      className={[
                        "w-[2px] flex-1 my-1 min-h-[24px]",
                        isCompleted ? "bg-[#00A651]" : "bg-[#E5E7EB]",
                      ].join(" ")}
                    />
                  )}
                </div>

                {/* Right column: Title + Caption */}
                <div className={isLast ? "pb-1" : "pb-4"}>
                  <p
                    className={[
                      "text-[15px] font-medium leading-[1.5]",
                      isCompleted || isActive
                        ? "text-[#111827]"
                        : "text-[#6B7280]",
                    ].join(" ")}
                  >
                    {step.title}
                  </p>
                  <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] break-words">
                    {step.getCaption(incident)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assigned ETA Highlight Card */}
      {incident.status === "assigned" && (
        <div className="mb-6">
          <Card className="bg-[#F7F8FA]">
            <div className="flex items-center gap-3">
              <IconCircle size="md" color="blue" icon={IconTruck} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium leading-[1.5] text-[#111827]">
                  Repair team assigned. ETA {incident.eta || "19:45"}.
                </p>
                <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280]">
                  Ward 8 municipal technical unit en route
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Action Row */}
      <div className="flex flex-col gap-3">
        <Button variant="secondary" fullWidth onClick={onFindHelp}>
          Find nearby help
        </Button>
        {incident.status !== "resolved" && (
          <Button
            variant="primary"
            fullWidth
            onClick={() => onConfirmResolved(incident.id)}
          >
            Confirm resolved
          </Button>
        )}
      </div>
    </BottomSheet>
  );
}
