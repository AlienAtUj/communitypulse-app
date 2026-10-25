import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import {
  HazardCategory,
  filterIncidentsByTab,
  filterNearbyIncidents,
} from "../lib/data";
import { ScreenHeader } from "../components/ScreenHeader";
import { IncidentCard } from "../components/IncidentCard";
import { HazardFilter } from "../components/HazardFilter";
import { EmptyState } from "../components/EmptyState";
import { Card } from "../components/Card";
import { BottomNav } from "../components/BottomNav";
import { IconList } from "../components/icons";

export function UpdatesScreen() {
  const {
    incidents,
    setSelectedIncidentId,
    visitedScreens,
    markScreenVisited,
    currentUser,
  } = useData();

  const [tab, setTab] = useState<"active" | "resolved">("active");
  const [scope, setScope] = useState<"nearby" | "mine" | "all">("nearby");
  const [selectedHazard, setSelectedHazard] = useState<HazardCategory>("all");
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

  const scopedIncidents = filterNearbyIncidents(incidents, currentUser, {
    scope,
  });

  const activeCount = scopedIncidents.filter((i) => i.status !== "resolved").length;
  const displayedIncidents = filterIncidentsByTab(
    scopedIncidents,
    tab,
    selectedHazard
  );

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-screen bg-[#FFFFFF] flex flex-col pb-24">
      <ScreenHeader
        title="What's Happening"
        subtitle={`${activeCount} ${
          activeCount === 1 ? "active incident" : "active incidents"
        } ${
          scope === "nearby"
            ? `near ${currentUser?.ward || "you"}`
            : scope === "mine"
            ? "reported by you"
            : "in all wards"
        }`}
      />

      <main className="flex-1 px-5 pt-5 flex flex-col gap-4">
        {/* Scope Selector: Near You | My Reports | All Wards */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScope("nearby")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-all cursor-pointer ${
              scope === "nearby"
                ? "bg-[#003DA5] text-[#FFFFFF] border-[#003DA5] shadow-sm"
                : "bg-[#F7F8FA] text-[#6B7280] border-[#E5E7EB] hover:text-[#111827]"
            }`}
          >
            Near You
          </button>
          <button
            type="button"
            onClick={() => setScope("mine")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-all cursor-pointer ${
              scope === "mine"
                ? "bg-[#003DA5] text-[#FFFFFF] border-[#003DA5] shadow-sm"
                : "bg-[#F7F8FA] text-[#6B7280] border-[#E5E7EB] hover:text-[#111827]"
            }`}
          >
            My Reports
          </button>
          <button
            type="button"
            onClick={() => setScope("all")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-all cursor-pointer ${
              scope === "all"
                ? "bg-[#003DA5] text-[#FFFFFF] border-[#003DA5] shadow-sm"
                : "bg-[#F7F8FA] text-[#6B7280] border-[#E5E7EB] hover:text-[#111827]"
            }`}
          >
            All Wards
          </button>
        </div>

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
              "flex-1 min-h-[44px] rounded-full px-4 py-2 text-[14px] leading-none transition-transform duration-100 active:scale-[0.98] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5]",
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
              "flex-1 min-h-[44px] rounded-full px-4 py-2 text-[14px] leading-none transition-transform duration-100 active:scale-[0.98] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5]",
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

        {/* Incident Count */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#6B7280]">
            {displayedIncidents.length} {displayedIncidents.length === 1 ? "Incident" : "Incidents"}
          </span>
        </div>

        {/* List or Loading Skeletons */}
        {loading ? (
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
              heading={
                selectedHazard !== "all"
                  ? "No matching incidents"
                  : scope === "mine"
                  ? "No reports by you"
                  : "All clear near you"
              }
              body={
                selectedHazard !== "all"
                  ? "No incidents matching this hazard filter."
                  : scope === "mine"
                  ? "You haven't reported any disruptions yet."
                  : scope === "nearby"
                  ? `No active incidents reported near ${currentUser?.ward || "you"} right now.`
                  : "No incidents recorded across any wards."
              }
              actionLabel={
                selectedHazard !== "all"
                  ? "Show All Types"
                  : scope === "mine"
                  ? "Show Nearby Incidents"
                  : scope === "nearby"
                  ? "Show All Wards"
                  : undefined
              }
              onAction={
                selectedHazard !== "all"
                  ? () => setSelectedHazard("all")
                  : scope === "mine"
                  ? () => setScope("nearby")
                  : scope === "nearby"
                  ? () => setScope("all")
                  : undefined
              }
            />
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
