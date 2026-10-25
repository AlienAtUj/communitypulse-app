import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { HazardCategory, filterIncidentsByTab } from "../lib/data";
import { ScreenHeader } from "../components/ScreenHeader";
import { IncidentCard } from "../components/IncidentCard";
import { HazardFilter } from "../components/HazardFilter";
import { EmptyState } from "../components/EmptyState";
import { Card } from "../components/Card";
import { BottomNav } from "../components/BottomNav";
import { IconList, IconMap } from "../components/icons";
import { IncidentMap } from "../components/IncidentMap";

export function UpdatesScreen() {
  const {
    incidents,
    setSelectedIncidentId,
    visitedScreens,
    markScreenVisited,
  } = useData();

  const [tab, setTab] = useState<"active" | "resolved">("active");
  const [selectedHazard, setSelectedHazard] = useState<HazardCategory>("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [loading, setLoading] = useState<boolean>(
    () => !visitedScreens["updates"]
  );

  useEffect(() => {
    if (!visitedScreens["updates"]) {
      const timer = window.setTimeout(() => {
        setLoading(false);
        markScreenVisited("updates");
      }, 800);
      return () => window.clearTimeout(timer);
    }
  }, [visitedScreens, markScreenVisited]);

  const activeCount = incidents.filter((i) => i.status !== "resolved").length;
  const displayedIncidents = filterIncidentsByTab(
    incidents,
    tab,
    selectedHazard
  );

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-screen bg-[#FFFFFF] flex flex-col pb-24">
      <ScreenHeader
        title="What's Happening"
        subtitle={`${activeCount} active incidents in Section C, Ward 8`}
      />

      <main className="flex-1 px-5 pt-5 flex flex-col gap-5">
        {/* Clean 2-way Segmented Tabs: Active | Resolved */}
        <div
          role="tablist"
          aria-label="Incident status filter"
          className="bg-[#F7F8FA] rounded-full p-1 flex border border-[#E5E7EB]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "active"}
            onClick={() => setTab("active")}
            className={[
              "flex-1 min-h-[48px] rounded-full px-4 py-2 text-[15px] leading-none transition-transform duration-100 active:scale-[0.98] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5]",
              tab === "active"
                ? "bg-[#FFFFFF] text-[#003DA5] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                : "text-[#6B7280] font-medium",
            ].join(" ")}
          >
            Active
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "resolved"}
            onClick={() => setTab("resolved")}
            className={[
              "flex-1 min-h-[48px] rounded-full px-4 py-2 text-[15px] leading-none transition-transform duration-100 active:scale-[0.98] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5]",
              tab === "resolved"
                ? "bg-[#FFFFFF] text-[#003DA5] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                : "text-[#6B7280] font-medium",
            ].join(" ")}
          >
            Resolved
          </button>
        </div>

        {/* Simple 4-button Hazard Filter */}
        <HazardFilter
          selected={selectedHazard}
          onChange={setSelectedHazard}
          ariaLabel="Filter updates by hazard type"
        />

        {/* View Mode Toggle: List vs Map */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#6B7280]">
            {displayedIncidents.length} {displayedIncidents.length === 1 ? "Incident" : "Incidents"}
          </span>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold bg-[#F7F8FA] border border-[#E5E7EB] text-[#003DA5] hover:bg-[#EEF0F4] transition-colors cursor-pointer"
          >
            {viewMode === "list" ? (
              <>
                <IconMap size={15} />
                <span>Show Map</span>
              </>
            ) : (
              <>
                <IconList size={15} />
                <span>Show List</span>
              </>
            )}
          </button>
        </div>

        {/* Map View */}
        {viewMode === "map" && !loading && (
          <div className="mb-2">
            <IncidentMap incidents={displayedIncidents} />
          </div>
        )}

        {/* List or Loading Skeletons */}
        {viewMode === "list" && (
          loading ? (
            <div className="flex flex-col gap-3" aria-label="Loading incidents">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-[40px] h-[40px] rounded-full bg-[#E5E7EB]" />
                      <div>
                        <div className="h-[16px] w-[120px] rounded bg-[#E5E7EB] mb-2" />
                        <div className="h-[12px] w-[160px] rounded bg-[#E5E7EB]" />
                      </div>
                    </div>
                    <div className="h-[24px] w-[72px] rounded-full bg-[#E5E7EB]" />
                  </div>
                </Card>
              ))}
            </div>
          ) : displayedIncidents.length > 0 ? (
            <div className="flex flex-col gap-3">
              {displayedIncidents.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  onClick={(item) => setSelectedIncidentId(item.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={IconList}
                heading="All clear"
                body={
                  selectedHazard !== "all"
                    ? "No incidents matching this hazard filter."
                    : tab === "active"
                    ? "No active incidents in your area right now."
                    : "No resolved incidents recorded yet."
                }
                actionLabel={
                  selectedHazard !== "all" ? "Show All" : undefined
                }
                onAction={
                  selectedHazard !== "all"
                    ? () => setSelectedHazard("all")
                    : undefined
                }
              />
            </Card>
          )
        )}
      </main>

      <BottomNav />
    </div>
  );
}
