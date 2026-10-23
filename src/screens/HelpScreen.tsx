import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { Resource, filterResourcesByCategory } from "../lib/data";
import { ScreenHeader } from "../components/ScreenHeader";
import { ResourceCard } from "../components/ResourceCard";
import { EmptyState } from "../components/EmptyState";
import { Card } from "../components/Card";
import { BottomSheet } from "../components/BottomSheet";
import { Button } from "../components/Button";
import { StatusBadge } from "../components/StatusBadge";
import { BottomNav } from "../components/BottomNav";
import { IconHelp, IconLocation, IconPhone, IconClock } from "../components/icons";

type FilterCategory = "all" | "water" | "food" | "charging" | "clinic" | "shelter";

const FILTER_PILLS: { id: FilterCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "water", label: "Water" },
  { id: "food", label: "Food" },
  { id: "charging", label: "Charging" },
  { id: "clinic", label: "Clinics" },
  { id: "shelter", label: "Shelter" },
];

export function HelpScreen() {
  const { resources, showToast, visitedScreens, markScreenVisited } = useData();
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !visitedScreens["help"]);

  useEffect(() => {
    if (!visitedScreens["help"]) {
      const timer = window.setTimeout(() => {
        setLoading(false);
        markScreenVisited("help");
      }, 800);
      return () => window.clearTimeout(timer);
    }
  }, [visitedScreens, markScreenVisited]);

  const filteredResources = filterResourcesByCategory(resources, selectedCategory);

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-screen bg-[#FFFFFF] flex flex-col pb-24">
      <ScreenHeader
        title="Find Help Nearby"
        subtitle="All resources verified by municipality or NGO partners"
      />

      <main className="flex-1 px-5 pt-5 flex flex-col gap-5">
        {/* Horizontal-scrolling filter pills */}
        <div
          role="tablist"
          aria-label="Resource category filter"
          className="flex gap-2 overflow-x-auto px-5 -mx-5 pb-2"
        >
          {FILTER_PILLS.map((pill) => {
            const isActive = selectedCategory === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(pill.id)}
                className={[
                  "min-h-[48px] px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-transform duration-100 active:scale-[0.98] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5]",
                  isActive
                    ? "bg-[#003DA5] text-[#FFFFFF]"
                    : "bg-[#F7F8FA] text-[#111827] border border-[#E5E7EB]",
                ].join(" ")}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Resource list or loading skeletons */}
        {loading ? (
          <div className="flex flex-col gap-4" aria-label="Loading resources">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-[40px] h-[40px] rounded-full bg-[#E5E7EB]" />
                  <div className="flex-1">
                    <div className="h-[16px] w-[160px] rounded bg-[#E5E7EB] mb-2" />
                    <div className="h-[12px] w-[120px] rounded bg-[#E5E7EB]" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredResources.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                onClick={(item) => setSelectedResource(item)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={IconHelp}
              heading="No resources in this category"
              body="Try a different filter."
              actionLabel="Show all resources"
              onAction={() => setSelectedCategory("all")}
            />
          </Card>
        )}
      </main>

      {/* Resource Info Bottom Sheet */}
      <BottomSheet
        isOpen={Boolean(selectedResource)}
        onClose={() => setSelectedResource(null)}
        title={selectedResource?.name || "Resource Info"}
      >
        {selectedResource && (
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-[20px] font-bold leading-[1.3] text-[#111827] break-words">
                {selectedResource.name}
              </h2>
              <StatusBadge status={selectedResource.status} />
            </div>

            <div className="flex flex-col gap-2 mb-6">
              <div className="flex items-center gap-2 text-[15px] text-[#111827]">
                <IconLocation size={18} className="text-[#003DA5] shrink-0" />
                <span>{selectedResource.distance} from Section C, Ward 8</span>
              </div>
              <div className="flex items-center gap-2 text-[15px] text-[#111827]">
                <IconClock size={18} className="text-[#003DA5] shrink-0" />
                <span>
                  {selectedResource.hours} · updated {selectedResource.updated}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[15px] text-[#111827]">
                <IconPhone size={18} className="text-[#003DA5] shrink-0" />
                <span>Ward 8 Helpdesk: 0800 222 700</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  const name = selectedResource.name;
                  setSelectedResource(null);
                  showToast(
                    `Opening walking directions to ${name}.`,
                    "info"
                  );
                }}
              >
                Navigate
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setSelectedResource(null);
                  showToast(
                    "Dialing Ward 8 Community Helpdesk (0800 222 700).",
                    "info"
                  );
                }}
              >
                Call facility
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomNav />
    </div>
  );
}
