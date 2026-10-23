import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { NgoNeed, getAggregatedNeeds } from "../lib/data";
import { ScreenHeader } from "../components/ScreenHeader";
import { SectionLabel } from "../components/SectionLabel";
import { Card } from "../components/Card";
import { IconCircle } from "../components/IconCircle";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/Button";
import { BottomSheet } from "../components/BottomSheet";
import { Input } from "../components/Input";
import { EmptyState } from "../components/EmptyState";
import { INCIDENT_ICONS, INCIDENT_COLORS } from "../components/IncidentCard";
import { IconHelp } from "../components/icons";

export function NgoScreen() {
  const {
    incidents,
    ngoOffers,
    submitNgoOffer,
    showToast,
    navigate,
    visitedScreens,
    markScreenVisited,
  } = useData();

  const [loading, setLoading] = useState<boolean>(() => !visitedScreens["ngo"]);
  const [selectedNeed, setSelectedNeed] = useState<NgoNeed | null>(null);
  const [provide, setProvide] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [eta, setEta] = useState<string>("");
  const [provideError, setProvideError] = useState<string>("");
  const [quantityError, setQuantityError] = useState<string>("");

  useEffect(() => {
    if (!visitedScreens["ngo"]) {
      const timer = window.setTimeout(() => {
        setLoading(false);
        markScreenVisited("ngo");
      }, 800);
      return () => window.clearTimeout(timer);
    }
  }, [visitedScreens, markScreenVisited]);

  const needs = getAggregatedNeeds(incidents, ngoOffers);

  const handleOpenOfferSheet = (need: NgoNeed) => {
    setSelectedNeed(need);
    setProvide(need.offerDetails?.provide || "");
    setQuantity(need.offerDetails?.quantity || "");
    setEta(need.offerDetails?.eta || "");
    setProvideError("");
    setQuantityError("");
  };

  const handleSendOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNeed) return;

    let hasError = false;
    if (!provide.trim()) {
      setProvideError("Please specify what support you can provide.");
      hasError = true;
    }
    if (!quantity.trim()) {
      setQuantityError("Please enter a quantity.");
      hasError = true;
    }
    if (hasError) return;

    submitNgoOffer(selectedNeed.type, {
      provide: provide.trim(),
      quantity: quantity.trim(),
      eta: eta.trim() || "Within 2 hours",
    });
    setSelectedNeed(null);
    showToast(
      "Offer sent to municipality. They'll respond shortly.",
      "success"
    );
  };

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-screen bg-[#FFFFFF] flex flex-col pb-24">
      <ScreenHeader
        title="Partner Dashboard"
        subtitle="Gift of the Givers · viewing Ward 8"
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
        <section>
          <SectionLabel>COMMUNITY NEEDS</SectionLabel>

          {loading ? (
            <div className="flex flex-col gap-4" aria-label="Loading community needs">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-[40px] h-[40px] rounded-full bg-[#E5E7EB]" />
                      <div>
                        <div className="h-[16px] w-[100px] rounded bg-[#E5E7EB] mb-2" />
                        <div className="h-[15px] w-[160px] rounded bg-[#E5E7EB]" />
                      </div>
                    </div>
                    <div className="h-[24px] w-[64px] rounded-full bg-[#E5E7EB]" />
                  </div>
                  <div className="h-[48px] w-full rounded-[12px] bg-[#E5E7EB]" />
                </Card>
              ))}
            </div>
          ) : needs.length > 0 ? (
            <div className="flex flex-col gap-4">
              {needs.map((need) => {
                const IconComp = INCIDENT_ICONS[need.type];
                const color = INCIDENT_COLORS[need.type];

                return (
                  <Card key={need.type}>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <IconCircle size="md" color={color} icon={IconComp} />
                        <div className="min-w-0">
                          <h3 className="text-[16px] font-bold leading-[1.4] text-[#111827]">
                            {need.label}
                          </h3>
                          <p className="text-[15px] font-normal leading-[1.5] text-[#111827] break-words">
                            {need.households} households affected
                          </p>
                          <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] break-words">
                            Ward 8 · {need.incidentsCount} active{" "}
                            {need.incidentsCount === 1 ? "incident" : "incidents"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StatusBadge status={need.priority} />
                        {need.offerSent && (
                          <StatusBadge status="offer sent" />
                        )}
                      </div>
                    </div>

                    <Button
                      variant={need.offerSent ? "secondary" : "primary"}
                      fullWidth
                      onClick={() => handleOpenOfferSheet(need)}
                    >
                      {need.offerSent ? "Update offer" : "I Can Help"}
                    </Button>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={IconHelp}
                heading="No active community needs"
                body="All reported community needs in Ward 8 are currently met."
              />
            </Card>
          )}
        </section>
      </main>

      {/* Offer Support Bottom Sheet */}
      <BottomSheet
        isOpen={Boolean(selectedNeed)}
        onClose={() => setSelectedNeed(null)}
        title="Offer support"
      >
        <form onSubmit={handleSendOffer} className="flex flex-col">
          <h2 className="text-[20px] font-bold leading-[1.3] text-[#111827] mb-4">
            Offer support
          </h2>

          <div className="flex flex-col gap-4 mb-6">
            <Input
              label="WHAT CAN YOU PROVIDE?"
              placeholder="e.g. Water tanker, 500L"
              value={provide}
              error={provideError}
              onChange={(e) => {
                setProvide(e.target.value);
                if (provideError) setProvideError("");
              }}
            />

            <Input
              label="QUANTITY"
              placeholder="e.g. 1"
              value={quantity}
              error={quantityError}
              onChange={(e) => {
                setQuantity(e.target.value);
                if (quantityError) setQuantityError("");
              }}
            />

            <Input
              label="ETA (OPTIONAL)"
              placeholder="e.g. Within 2 hours"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" fullWidth>
            Send offer
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
