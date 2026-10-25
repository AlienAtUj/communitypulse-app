import React, { useState } from "react";
import { useData } from "../context/DataContext";
import {
  HazardCategory,
  filterIncidentsByHazard,
  filterNearbyIncidents,
  sortIncidents,
} from "../lib/data";
import { ScreenHeader } from "../components/ScreenHeader";
import { AlertBanner } from "../components/AlertBanner";
import { SectionLabel } from "../components/SectionLabel";
import { Card } from "../components/Card";
import { CategoryVisual } from "../components/CategoryVisual";
import { IncidentCard } from "../components/IncidentCard";
import { HazardFilter } from "../components/HazardFilter";
import { EmptyState } from "../components/EmptyState";
import { BottomNav } from "../components/BottomNav";
import { AuthModal } from "../components/AuthModal";
import { FirebaseStatusModal } from "../components/FirebaseStatusModal";
import {
  IconLocation,
  IconReport,
  IconList,
  IconHelp,
  IconArrowRight,
} from "../components/icons";

export function HomeScreen() {
  const {
    incidents,
    activeAlert,
    dismissAlert,
    navigate,
    setSelectedIncidentId,
    currentUser,
    isLiveDatabase,
  } = useData();

  const [selectedHazard, setSelectedHazard] = useState<HazardCategory>("all");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDbStatusOpen, setIsDbStatusOpen] = useState(false);

  // Filter so residents only see incidents near them or reported by them
  const nearbyIncidents = filterNearbyIncidents(incidents, currentUser, {
    scope: "nearby",
  });

  const activeIncidentsCount = nearbyIncidents.filter(
    (inc) => inc.status !== "resolved"
  ).length;

  const activeFiltered = sortIncidents(
    filterIncidentsByHazard(
      nearbyIncidents.filter((inc) => inc.status !== "resolved"),
      selectedHazard
    )
  );

  const myRecentReports = filterIncidentsByHazard(
    incidents.filter(
      (inc) =>
        inc.isMine ||
        (currentUser?.uid &&
          (inc as unknown as { userId?: string }).userId === currentUser.uid)
    ),
    selectedHazard
  ).slice(0, 2);

  const displayedHomeIncidents =
    selectedHazard === "all"
      ? myRecentReports.length > 0
        ? myRecentReports
        : activeFiltered.slice(0, 2)
      : activeFiltered;

  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const greetingName = currentUser?.displayName
    ? currentUser.displayName.split(" ")[0]
    : "Neighbor";

  const locationChip = (
    <button
      type="button"
      onClick={() => setIsAuthOpen(true)}
      className="inline-flex items-center gap-1.5 bg-[#F7F8FA] hover:bg-[#EEF0F4] border border-[#E5E7EB] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
      title="Click to manage account and ward location"
    >
      <IconLocation size={16} className="text-[#003DA5] shrink-0" />
      <span className="text-[12px] font-medium leading-[1.4] text-[#111827] whitespace-nowrap">
        {currentUser?.ward || "Set your location"}
      </span>
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-screen bg-[#FFFFFF] flex flex-col pb-24">
      <ScreenHeader
        title={`${timeGreeting}, ${greetingName}`}
        isDisplay
        showLogo
        onLogoClick={() => setIsAuthOpen(true)}
        onDbStatusClick={() => setIsDbStatusOpen(true)}
        rightSlot={locationChip}
      />

      <main className="flex-1 px-5 pt-5 flex flex-col gap-6">
        {activeAlert && (
          <AlertBanner
            variant={activeAlert.variant}
            icon={activeAlert.icon}
            text={activeAlert.text}
            onDismiss={dismissAlert}
          />
        )}

        {/* Section: WHAT DO YOU NEED? */}
        <section>
          <SectionLabel>WHAT DO YOU NEED?</SectionLabel>
          <div className="flex flex-col gap-3">
            {/* Card 1 -> /report */}
            <Card
              onClick={() => navigate("/report")}
              ariaLabel="Report a Problem: Power, water, food, roads, floods"
            >
              <div className="flex items-center justify-between gap-3.5">
                <div className="flex items-center gap-3.5 min-w-0">
                  <CategoryVisual category="action-report" variant="thumbnail" />
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-bold leading-[1.4] text-[#111827]">
                      Report a Problem
                    </h3>
                    <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] break-words">
                      Power, water, food, roads, floods
                    </p>
                  </div>
                </div>
                <IconArrowRight size={20} className="text-[#6B7280] shrink-0" />
              </div>
            </Card>

            {/* Card 2 -> /updates */}
            <Card
              onClick={() => navigate("/updates")}
              ariaLabel={`What's Happening: ${activeIncidentsCount} active incidents and scheduled outages`}
            >
              <div className="flex items-center justify-between gap-3.5">
                <div className="flex items-center gap-3.5 min-w-0">
                  <CategoryVisual category="action-schedules" variant="thumbnail" />
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-bold leading-[1.4] text-[#111827]">
                      What's Happening
                    </h3>
                    <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] break-words">
                      {activeIncidentsCount} active incidents &amp; outage schedule
                    </p>
                  </div>
                </div>
                <IconArrowRight size={20} className="text-[#6B7280] shrink-0" />
              </div>
            </Card>

            {/* Card 3 -> /help */}
            <Card
              onClick={() => navigate("/help")}
              ariaLabel="Find Help: Water, food, charging, clinics"
            >
              <div className="flex items-center justify-between gap-3.5">
                <div className="flex items-center gap-3.5 min-w-0">
                  <CategoryVisual category="action-help" variant="thumbnail" />
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-bold leading-[1.4] text-[#111827]">
                      Find Help
                    </h3>
                    <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] break-words">
                      Water, food, charging, clinics
                    </p>
                  </div>
                </div>
                <IconArrowRight size={20} className="text-[#6B7280] shrink-0" />
              </div>
            </Card>
          </div>
        </section>

        {/* Section: YOUR RECENT REPORTS & NEARBY */}
        <section>
          <SectionLabel>
            {selectedHazard === "all"
              ? myRecentReports.length > 0
                ? "YOUR REPORTS & NEARBY"
                : currentUser?.ward
                ? `INCIDENTS NEAR ${currentUser.ward.toUpperCase()}`
                : "INCIDENTS NEAR YOU"
              : "INCIDENTS NEAR YOU"}
          </SectionLabel>

          <div className="mb-3">
            <HazardFilter
              selected={selectedHazard}
              onChange={setSelectedHazard}
              ariaLabel="Filter Home incidents by hazard type"
            />
          </div>

          {displayedHomeIncidents.length > 0 ? (
            <div className="flex flex-col gap-3">
              {displayedHomeIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onClick={(inc) => setSelectedIncidentId(inc.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={IconReport}
                heading={
                  selectedHazard !== "all"
                    ? "No matching incidents"
                    : "All clear near you"
                }
                body={
                  selectedHazard !== "all"
                    ? "No active incidents for this hazard type in your area."
                    : currentUser?.ward
                    ? `No active disruptions reported near ${currentUser.ward}. Tap Report a Problem to log a local issue.`
                    : "No active disruptions reported near you. Tap Report a Problem to log a local issue."
                }
                actionLabel={
                  selectedHazard !== "all"
                    ? "Show All Types"
                    : "Report a Problem"
                }
                onAction={() =>
                  selectedHazard !== "all"
                    ? setSelectedHazard("all")
                    : navigate("/report")
                }
              />
            </Card>
          )}
        </section>

        {/* Demo Entry Links Footer (Specified in Section 3.1) */}
        <footer className="pt-4 pb-2 border-t border-[#E5E7EB] flex items-center justify-between text-[12px] text-[#6B7280]">
          <span>CommunityPulse SA</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="min-h-[48px] px-2 text-[12px] font-medium text-[#6B7280] underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5]"
            >
              Responder View
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => navigate("/ngo")}
              className="min-h-[48px] px-2 text-[12px] font-medium text-[#6B7280] underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5]"
            >
              NGO Partner View
            </button>
          </div>
        </footer>
      </main>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <FirebaseStatusModal isOpen={isDbStatusOpen} onClose={() => setIsDbStatusOpen(false)} />

      <BottomNav />
    </div>
  );
}
