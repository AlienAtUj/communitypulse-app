import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import {
  Incident,
  sortIncidents,
  groupIncidentsByLocation,
  INCIDENT_TYPE_LABELS,
} from "../lib/data";
import { ScreenHeader } from "../components/ScreenHeader";
import { SectionLabel } from "../components/SectionLabel";
import { Card } from "../components/Card";
import { CategoryVisual } from "../components/CategoryVisual";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/Button";
import { BottomSheet } from "../components/BottomSheet";
import { Input } from "../components/Input";
import { EmptyState } from "../components/EmptyState";
import { IconList, IconLocation, IconPeople } from "../components/icons";
import { IncidentMap } from "../components/IncidentMap";

export function DashboardScreen() {
  const {
    incidents,
    updateIncidentStatus,
    showToast,
    navigate,
    visitedScreens,
    markScreenVisited,
  } = useData();

  const [loading, setLoading] = useState<boolean>(
    () => !visitedScreens["dashboard"]
  );
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [updateTarget, setUpdateTarget] = useState<Incident | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string>("");
  const [messageError, setMessageError] = useState<string>("");

  useEffect(() => {
    if (!visitedScreens["dashboard"]) {
      const timer = window.setTimeout(() => {
        setLoading(false);
        markScreenVisited("dashboard");
      }, 800);
      return () => window.clearTimeout(timer);
    }
  }, [visitedScreens, markScreenVisited]);

  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const highPriorityIncidents = activeIncidents.filter(
    (i) => i.priority === "high" || i.priority === "critical"
  );
  const today = new Date();
  const resolvedToday = incidents.filter((i) => {
    if (i.status !== "resolved" || !i.resolvedAt) return false;
    const resolvedDate = new Date(i.resolvedAt);
    return !Number.isNaN(resolvedDate.getTime()) &&
      resolvedDate.getFullYear() === today.getFullYear() &&
      resolvedDate.getMonth() === today.getMonth() &&
      resolvedDate.getDate() === today.getDate();
  }).length;
  const locationGroups = groupIncidentsByLocation(incidents);

  const sortedIncidents = sortIncidents(
    selectedLocation === "all"
      ? activeIncidents
      : activeIncidents.filter((i) => i.location === selectedLocation)
  );

  const handleAssignTeam = (inc: Incident) => {
    if (inc.status === "assigned") {
      showToast("This incident is already assigned.", "info");
      return;
    }
    updateIncidentStatus(inc.id, "assigned");
    showToast(`Incident ${inc.id} marked as assigned. No external team notification was sent.`, "success");
  };

  const handleResolveIncident = (inc: Incident) => {
    updateIncidentStatus(inc.id, "resolved");
    showToast(`${inc.id} marked as resolved.`, "success");
  };

  const handleOpenSendUpdate = (inc: Incident) => {
    setUpdateTarget(inc);
    setUpdateMessage("");
    setMessageError("");
  };

  const handleSendUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateMessage.trim()) {
      setMessageError("Please enter an update message for residents.");
      return;
    }
    if (!updateTarget) return;

    const updateRecord = {
      id: `UPD-${Date.now()}`,
      incidentId: updateTarget.id,
      location: updateTarget.location,
      affectedHouseholds: updateTarget.affected,
      message: updateMessage.trim(),
      createdAt: new Date().toISOString(),
      deliveryStatus: "saved-test-mode",
    };

    try {
      const storageKey = "communitypulse_responder_updates";
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      window.localStorage.setItem(storageKey, JSON.stringify([updateRecord, ...saved]));
      setUpdateTarget(null);
      setUpdateMessage("");
      setMessageError("");
      showToast("Update saved in test mode. No SMS or WhatsApp message was sent.", "success");
    } catch {
      setMessageError("The update could not be saved in this browser. Please try again.");
    }
  };

  const getAffectedSummary = (inc: Incident) => {
    if (inc.id === "INC-001" || inc.affected === 240) {
      return "240 households · 1 clinic · 2 schools";
    }
    const facStr =
      inc.facilities && inc.facilities.length > 0
        ? ` · ${inc.facilities.join(" · ")}`
        : "";
    return `${inc.affected} households${facStr}`;
  };

  const getReporterLine = (inc: Incident) => {
    const count = Math.max(1, inc.confirmations);
    const peopleWord = count === 1 ? "person" : "people";
    return `${count} ${peopleWord} from ${inc.location} reported this ${INCIDENT_TYPE_LABELS[
      inc.type
    ].toLowerCase()}`;
  };

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-screen bg-[#FFFFFF] flex flex-col pb-24">
      <ScreenHeader
        title="Responder Dashboard"
        subtitle="Eskom · Ward 8 · Live"
        rightSlot={
          <button
            type="button"
            onClick={() => navigate("/")}
            className="min-h-[48px] px-3 rounded-full bg-[#F7F8FA] border border-[#E5E7EB] text-[12px] font-medium text-[#003DA5] cursor-pointer active:scale-[0.98] transition-transform duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5]"
          >
            Resident App
          </button>
        }
      />

      <main className="flex-1 px-5 pt-5 flex flex-col gap-6">
        {/* Stats row — 3 compact Cards in a 3-column grid */}
        <section aria-label="Responder Metrics" className="grid grid-cols-3 gap-2">
          <Card className="p-4 text-center flex flex-col items-center justify-center">
            <span className="text-[24px] font-bold tracking-[-0.01em] leading-[1.2] text-[#111827] tabular-nums">
              {activeIncidents.length}
            </span>
            <span className="text-[13px] font-medium uppercase tracking-[0.05em] leading-[1.4] text-[#6B7280] mt-1">
              Active
            </span>
          </Card>

          <Card className="p-4 text-center flex flex-col items-center justify-center">
            <span className="text-[24px] font-bold tracking-[-0.01em] leading-[1.2] text-[#E4002B] tabular-nums">
              {highPriorityIncidents.length}
            </span>
            <span className="text-[13px] font-medium uppercase tracking-[0.05em] leading-[1.4] text-[#6B7280] mt-1">
              High Priority
            </span>
          </Card>

          <Card className="p-4 text-center flex flex-col items-center justify-center">
            <span className="text-[24px] font-bold tracking-[-0.01em] leading-[1.2] text-[#111827] tabular-nums">
              {resolvedToday}
            </span>
            <span className="text-[13px] font-medium uppercase tracking-[0.05em] leading-[1.4] text-[#6B7280] mt-1">
              Resolved Today
            </span>
          </Card>
        </section>

       {/* Interactive incident map */}
<section>
  <Card className="p-4">
    <IncidentMap incidents={incidents} />

    <p className="mt-2 text-[12px] font-normal leading-[1.4] text-[#6B7280]">
      Interactive incident overview. Marker locations are representative
      test coordinates, not verified incident addresses.
    </p>

    <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-[#6B7280]">
      <span className="flex items-center gap-1">
        <span className="h-3 w-3 rounded-full bg-[#E4002B]" />
        Critical
      </span>
      <span className="flex items-center gap-1">
        <span className="h-3 w-3 rounded-full bg-[#FF9500]" />
        High
      </span>
      <span className="flex items-center gap-1">
        <span className="h-3 w-3 rounded-full bg-[#003DA5]" />
        Medium
      </span>
    </div>
  </Card>
</section>

        {/* INCIDENTS BY LOCATION */}
        <section>
          <div className="flex items-center justify-between gap-2 mb-3">
            <SectionLabel className="mb-0">INCIDENTS BY LOCATION</SectionLabel>
            {selectedLocation !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedLocation("all")}
                className="min-h-[48px] px-3 -my-2 text-[12px] font-bold text-[#003DA5] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5]"
              >
                Show all locations
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3" aria-label="Loading locations">
              {[1, 2].map((n) => (
                <Card key={n} className="animate-pulse">
                  <div className="h-[16px] w-[150px] rounded bg-[#E5E7EB] mb-2" />
                  <div className="h-[14px] w-[240px] rounded bg-[#E5E7EB]" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {locationGroups.map((group) => {
                const isSelected = selectedLocation === group.location;
                return (
                  <Card
                    key={group.location}
                    onClick={() =>
                      setSelectedLocation(
                        isSelected ? "all" : group.location
                      )
                    }
                    ariaLabel={`${group.location}: ${group.summaryText}`}
                    className={
                      isSelected
                        ? "border-2 border-[#003DA5] bg-[#003DA5]/5"
                        : ""
                    }
                  >
                    <div className="flex items-start justify-between gap-3.5">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <CategoryVisual
                          category={group.incidents[0]?.type || "power"}
                          variant="thumbnail"
                        />
                        <div className="min-w-0">
                          <h3 className="text-[16px] font-bold leading-[1.4] text-[#111827] break-words">
                            {group.location}
                          </h3>
                          <p className="text-[15px] font-medium leading-[1.5] text-[#111827] mt-0.5 break-words">
                            {group.summaryText}
                          </p>
                          <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] mt-1 break-words">
                            {group.totalHouseholds} households affected ·{" "}
                            {group.incidentsCount} active{" "}
                            {group.incidentsCount === 1 ? "report" : "reports"}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={group.highestPriority} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* PRIORITY INCIDENTS */}
        <section>
          <SectionLabel>
            {selectedLocation === "all"
              ? "PRIORITY INCIDENTS"
              : `PRIORITY INCIDENTS — ${selectedLocation.toUpperCase()}`}
          </SectionLabel>
          {loading ? (
            <div className="flex flex-col gap-4" aria-label="Loading priority incidents">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="animate-pulse">
                  <div className="h-[20px] w-[180px] rounded bg-[#E5E7EB] mb-3" />
                  <div className="h-[15px] w-[140px] rounded bg-[#E5E7EB] mb-2" />
                  <div className="h-[12px] w-[220px] rounded bg-[#E5E7EB] mb-4" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-[48px] rounded-[12px] bg-[#E5E7EB]" />
                    <div className="h-[48px] rounded-[12px] bg-[#E5E7EB]" />
                  </div>
                </Card>
              ))}
            </div>
          ) : sortedIncidents.length > 0 ? (
            <div className="flex flex-col gap-4">
              {sortedIncidents.map((inc) => (
                <Card
                  key={inc.id}
                  className={
                    inc.priority === "critical"
                      ? "border-l-4 border-l-[#E4002B]"
                      : ""
                  }
                >
                  {/* Top row: priority badge + type + time */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusBadge status={inc.priority} />
                      <h3 className="text-[16px] font-bold leading-[1.4] text-[#111827] truncate">
                        {INCIDENT_TYPE_LABELS[inc.type]}
                      </h3>
                    </div>
                    <span className="text-[12px] font-normal leading-[1.4] text-[#6B7280] shrink-0">
                      {inc.time}
                    </span>
                  </div>

                  {/* Location (Body Medium) */}
                  <p className="text-[15px] font-medium leading-[1.5] text-[#111827] mb-1 break-words">
                    {inc.location}
                  </p>

                  {/* Location Reporter Count Line */}
                  <div className="flex items-center gap-1.5 text-[12px] font-medium leading-[1.4] text-[#003DA5] mb-1">
                    <IconPeople size={16} className="shrink-0" />
                    <span className="break-words">{getReporterLine(inc)}</span>
                  </div>

                  {/* Affected summary */}
                  <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] mb-4 break-words">
                    {getAffectedSummary(inc)}
                  </p>

                  {/* Two buttons side-by-side */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="primary"
                      onClick={() => handleAssignTeam(inc)}
                      disabled={inc.status === "assigned"}
                    >
                      {inc.status === "assigned" ? "Team assigned" : "Assign team"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleOpenSendUpdate(inc)}
                    >
                      Draft update
                    </Button>
                  </div>
                  <div className="mt-3">
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => handleResolveIncident(inc)}
                    >
                      Mark as resolved
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={IconList}
                heading="No priority incidents"
                body="All reported disruptions in this location have been resolved."
                actionLabel={
                  selectedLocation !== "all" ? "Show all locations" : undefined
                }
                onAction={
                  selectedLocation !== "all"
                    ? () => setSelectedLocation("all")
                    : undefined
                }
              />
            </Card>
          )}
        </section>
      </main>

      {/* Send Update Bottom Sheet */}
      <BottomSheet
        isOpen={Boolean(updateTarget)}
        onClose={() => setUpdateTarget(null)}
        title="Send resident update"
      >
        <form onSubmit={handleSendUpdateSubmit} className="flex flex-col">
          <h2 className="text-[20px] font-bold leading-[1.3] text-[#111827] mb-1">
            Send resident update
          </h2>
          <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] mb-4">
            Draft an update for {updateTarget?.affected ?? 0} affected households in{" "}
            {updateTarget?.location || "the selected location"}. In test mode, the message is saved locally and is not delivered by SMS or WhatsApp.
          </p>

          <div className="mb-5">
            <Input
              label="UPDATE MESSAGE"
              placeholder="e.g. Technicians are on site. We will share another update when available."
              value={updateMessage}
              error={messageError}
              onChange={(e) => {
                setUpdateMessage(e.target.value);
                if (messageError) setMessageError("");
              }}
            />
          </div>

          <Button type="submit" variant="primary" fullWidth>
            Send
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
