import React, { useState } from "react";
import { Incident, INCIDENT_TYPE_LABELS } from "../lib/data";
import { useData } from "../context/DataContext";
import { BottomSheet } from "../components/BottomSheet";
import { CategoryVisual } from "../components/CategoryVisual";
import { StatusBadge } from "../components/StatusBadge";
import { SectionLabel } from "../components/SectionLabel";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { INCIDENT_ICONS, INCIDENT_COLORS } from "../components/IncidentCard";
import { IconCheck, IconTruck, IconBell, IconLocation } from "../components/icons";

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
  const { confirmIncident } = useData();
  const [hasConfirmed, setHasConfirmed] = useState(false);

  if (!incident) return null;

  const IconComp = INCIDENT_ICONS[incident.type];
  const color = INCIDENT_COLORS[incident.type];
  const typeLabel = INCIDENT_TYPE_LABELS[incident.type];
  const currentIndex = STATUS_INDEX[incident.status];

  const handleConfirmIncident = () => {
    if (hasConfirmed) return;
    confirmIncident(incident.id);
    setHasConfirmed(true);
  };

  return (
    <BottomSheet
      isOpen={Boolean(incident)}
      onClose={onClose}
      title={`${typeLabel} details`}
    >
      {/* Real Category Hero Banner */}
      <div className="mb-4">
        <CategoryVisual category={incident.type} variant="hero" />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <CategoryVisual category={incident.type} variant="avatar" />
          <h2 className="text-[20px] font-bold leading-[1.3] text-[#111827] break-words">
            {typeLabel}
          </h2>
        </div>
        <StatusBadge status={incident.status} />
      </div>

      {/* Location & Directions Row */}
      <div className="flex flex-col gap-2 mb-4">
        <p className="text-[13px] font-medium leading-[1.4] text-[#111827] break-words">
          {incident.location}
        </p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[12px] text-[#6B7280]">
            Reported {incident.time} · {incident.confirmations} neighbours confirmed
          </span>
          <button
            type="button"
            onClick={() => {
              const dest = incident.coordinates
                ? `${incident.coordinates.lat},${incident.coordinates.lng}`
                : encodeURIComponent(incident.location);
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
                "_blank",
                "noopener,noreferrer"
              );
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold text-[#003DA5] bg-[#003DA5]/5 hover:bg-[#003DA5]/10 border border-[#003DA5]/20 cursor-pointer transition-colors"
          >
            <IconLocation size={14} className="text-[#003DA5]" />
            <span>Directions in Maps</span>
          </button>
        </div>
      </div>

      {/* Description */}
      {incident.description && (
        <p className="text-[15px] font-normal leading-[1.5] text-[#111827] mb-5 break-words">
          {incident.description}
        </p>
      )}

      {/* Official Responder Live Update from Firestore */}
      {incident.latestUpdate && (
        <div className="p-3.5 mb-5 rounded-2xl bg-[#00A651]/10 border border-[#00A651]/25">
          <div className="flex items-center gap-1.5 mb-1 text-[12px] font-bold text-[#00A651]">
            <IconBell size={14} className="text-[#00A651] shrink-0" />
            <span>Official Update ({incident.latestUpdateBy || "Municipal Technical Unit"}):</span>
          </div>
          <p className="text-[14px] font-medium text-[#111827]">
            {incident.latestUpdate}
          </p>
        </div>
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
              <div className="w-12 h-12 rounded-xl bg-[#003DA5]/10 text-[#003DA5] border border-[#003DA5]/20 flex items-center justify-center shrink-0">
                <IconTruck size={22} />
              </div>
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
        {incident.status !== "resolved" && (
          <Button
            variant={hasConfirmed ? "secondary" : "primary"}
            fullWidth
            disabled={hasConfirmed}
            onClick={handleConfirmIncident}
          >
            {hasConfirmed ? (
              <span className="inline-flex items-center gap-1.5">
                <IconCheck size={16} /> Problem confirmed by you
              </span>
            ) : (
              `I also have this problem (${incident.confirmations} confirmed)`
            )}
          </Button>
        )}

        <Button variant="secondary" fullWidth onClick={onFindHelp}>
          Find nearby help
        </Button>

        {incident.status !== "resolved" && (
          <Button
            variant="ghost"
            fullWidth
            onClick={() => onConfirmResolved(incident.id)}
          >
            Mark as resolved
          </Button>
        )}
      </div>
    </BottomSheet>
  );
}
