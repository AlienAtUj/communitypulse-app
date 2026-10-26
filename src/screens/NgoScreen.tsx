import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { NgoNeed, getAggregatedNeeds } from "../lib/data";
import { ScreenHeader } from "../components/ScreenHeader";
import { SectionLabel } from "../components/SectionLabel";
import { Card } from "../components/Card";
import { CategoryVisual } from "../components/CategoryVisual";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/Button";
import { BottomSheet } from "../components/BottomSheet";
import { Input } from "../components/Input";
import { EmptyState } from "../components/EmptyState";
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
    currentUser,
  } = useData();

  const [loading, setLoading] = useState<boolean>(
    () => !visitedScreens["ngo"]
  );

  const [selectedNeed, setSelectedNeed] =
    useState<NgoNeed | null>(null);

  const [provide, setProvide] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [eta, setEta] = useState<string>("");

  const [provideError, setProvideError] = useState<string>("");
  const [quantityError, setQuantityError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!visitedScreens["ngo"]) {
      const timer = window.setTimeout(() => {
        setLoading(false);
        markScreenVisited("ngo");
      }, 800);

      return () => window.clearTimeout(timer);
    }

    setLoading(false);
  }, [visitedScreens, markScreenVisited]);

  const needs = getAggregatedNeeds(incidents, ngoOffers);

  const handleOpenOfferSheet = (need: NgoNeed) => {
    setSelectedNeed(need);

    // Every submission creates a new offer.
    // It does not overwrite another NGO's offer.
    setProvide("");
    setQuantity("");
    setEta("");

    setProvideError("");
    setQuantityError("");
  };

  const handleCloseOfferSheet = () => {
    if (submitting) return;

    setSelectedNeed(null);
    setProvide("");
    setQuantity("");
    setEta("");
    setProvideError("");
    setQuantityError("");
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedNeed || submitting) return;

    let hasError = false;

    if (!provide.trim()) {
      setProvideError(
        "Please specify what support you can provide."
      );
      hasError = true;
    }

    if (!quantity.trim()) {
      setQuantityError("Please enter a quantity.");
      hasError = true;
    }

    if (hasError) return;

    setSubmitting(true);

    try {
      await submitNgoOffer(selectedNeed.type, {
        provide: provide.trim(),
        quantity: quantity.trim(),
        eta: eta.trim() || "Within 2 hours",
        ngoName:
          currentUser?.displayName ||
          currentUser?.email ||
          "Community NGO",
      });

      setSelectedNeed(null);
      setProvide("");
      setQuantity("");
      setEta("");
      setProvideError("");
      setQuantityError("");

      showToast("Offer submitted successfully.", "success");
    } catch (error) {
      console.error("Failed to submit NGO offer:", error);
      showToast("Failed to save offer. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-screen bg-[#FFFFFF] flex flex-col pb-24">
      <ScreenHeader
        title="Partner Dashboard"
        subtitle="Gift of the Givers · Community Response"
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
            <div
              className="flex flex-col gap-4"
              aria-label="Loading community needs"
            >
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
                const offerCount = need.offers.length;

                // Use the actual locations on the incidents contributing
                // to this category, not a hardcoded ward.
                const locations = [
                  ...new Set(
                    need.incidents
                      .map((incident) => incident.location?.trim())
                      .filter(
                        (location): location is string =>
                          Boolean(location)
                      )
                  ),
                ];

                return (
                  <Card key={need.type}>
                    <div className="flex items-start justify-between gap-3.5 mb-4">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <CategoryVisual
                          category={need.type}
                          variant="thumbnail"
                        />

                        <div className="min-w-0">
                          <h3 className="text-[16px] font-bold leading-[1.4] text-[#111827]">
                            {need.label}
                          </h3>

                          <p className="text-[15px] font-normal leading-[1.5] text-[#111827] break-words">
                            {need.households}{" "}
                            {need.households === 1
                              ? "household"
                              : "households"}{" "}
                            affected
                          </p>

                          <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] break-words">
                            {need.incidentsCount} active{" "}
                            {need.incidentsCount === 1
                              ? "incident"
                              : "incidents"}
                          </p>

                          {locations.length > 0 && (
                            <div className="mt-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                Reported locations
                              </p>

                              <ul className="mt-1 flex flex-col gap-1">
                                {locations.map((location) => (
                                  <li
                                    key={location}
                                    className="text-[12px] leading-[1.5] text-[#003DA5] break-words"
                                  >
                                    <span aria-hidden="true">📍 </span>
                                    {location}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {locations.length === 0 && (
                            <p className="mt-1 text-[12px] text-[#6B7280]">
                              Location not provided
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StatusBadge status={need.priority} />

                        {offerCount > 0 && (
                          <span className="px-2 py-1 rounded-full bg-[#E8F5E9] text-[#166534] text-[11px] font-semibold text-right">
                            {offerCount}{" "}
                            {offerCount === 1 ? "offer" : "offers"}{" "}
                            received
                          </span>
                        )}
                      </div>
                    </div>

                    {offerCount > 0 && (
                      <div className="mb-4 flex flex-col gap-3">
                        <h4 className="text-[13px] font-semibold text-[#111827]">
                          NGO offers
                        </h4>

                        {need.offers.map((offer) => (
                          <div
                            key={offer.id}
                            className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3"
                          >
                            <p className="text-[13px] font-semibold text-[#111827] break-words">
                              {offer.ngoName || "Community NGO"}
                            </p>

                            <p className="mt-1 text-[13px] text-[#374151] break-words">
                              <span className="font-medium">
                                Providing:
                              </span>{" "}
                              {offer.provide}
                            </p>

                            <p className="mt-1 text-[13px] text-[#374151] break-words">
                              <span className="font-medium">
                                Quantity:
                              </span>{" "}
                              {offer.quantity}
                            </p>

                            <p className="mt-1 text-[13px] text-[#374151] break-words">
                              <span className="font-medium">
                                ETA:
                              </span>{" "}
                              {offer.eta || "Not specified"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      variant={offerCount > 0 ? "secondary" : "primary"}
                      fullWidth
                      onClick={() => handleOpenOfferSheet(need)}
                    >
                      {offerCount > 0
                        ? "Submit another offer"
                        : "I Can Help"}
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
                body="There are currently no unresolved incidents requiring support."
              />
            </Card>
          )}
        </section>
      </main>

      <BottomSheet
        isOpen={Boolean(selectedNeed)}
        onClose={handleCloseOfferSheet}
        title="Offer support"
      >
        <form
          onSubmit={handleSendOffer}
          className="flex flex-col"
        >
          <h2 className="text-[20px] font-bold leading-[1.3] text-[#111827] mb-2">
            Offer support
          </h2>

          {selectedNeed && (
            <>
              <p className="text-[14px] text-[#6B7280] mb-2">
                Community need: {selectedNeed.label}
              </p>

              {selectedNeed.incidents.length > 0 && (
                <p className="text-[12px] text-[#003DA5] mb-4 break-words">
                  Locations:{" "}
                  {[
                    ...new Set(
                      selectedNeed.incidents
                        .map((incident) => incident.location?.trim())
                        .filter(Boolean)
                    ),
                  ].join(" · ") || "Not provided"}
                </p>
              )}
            </>
          )}

          <div className="flex flex-col gap-4 mb-6">
            <Input
              label="WHAT CAN YOU PROVIDE?"
              placeholder="e.g. Water tanker, 500L"
              value={provide}
              error={provideError}
              onChange={(e) => {
                setProvide(e.target.value);

                if (provideError) {
                  setProvideError("");
                }
              }}
            />

            <Input
              label="QUANTITY"
              placeholder="e.g. 50 food parcels"
              value={quantity}
              error={quantityError}
              onChange={(e) => {
                setQuantity(e.target.value);

                if (quantityError) {
                  setQuantityError("");
                }
              }}
            />

            <Input
              label="ETA (OPTIONAL)"
              placeholder="e.g. Within 2 hours"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Send offer"}
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
