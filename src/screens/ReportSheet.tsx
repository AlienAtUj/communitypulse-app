import React, { useState, useEffect } from "react";
import { IncidentType, INCIDENT_CATEGORY_NAMES } from "../lib/data";
import { useData } from "../context/DataContext";
import { BottomSheet } from "../components/BottomSheet";
import { Card } from "../components/Card";
import { CategoryVisual } from "../components/CategoryVisual";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import {
  IconPower,
  IconWater,
  IconFood,
  IconRoad,
  IconFlood,
  IconFire,
  IconLocation,
  IconCheck,
  IconReport,
  IconProps,
} from "../components/icons";

const REPORT_TYPES: {
  type: IncidentType;
  label: string;
  icon: React.ComponentType<IconProps>;
}[] = [
  { type: "power", label: INCIDENT_CATEGORY_NAMES.power, icon: IconPower },
  { type: "water", label: INCIDENT_CATEGORY_NAMES.water, icon: IconWater },
  { type: "food", label: INCIDENT_CATEGORY_NAMES.food, icon: IconFood },
  { type: "road", label: INCIDENT_CATEGORY_NAMES.road, icon: IconRoad },
  { type: "flood", label: INCIDENT_CATEGORY_NAMES.flood, icon: IconFlood },
  { type: "fire", label: INCIDENT_CATEGORY_NAMES.fire, icon: IconFire },
];

export function ReportSheet() {
  const { isReportOpen, setIsReportOpen, submitReport, showToast, navigate } = useData();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [location] = useState<string>("Section C, Ward 8");
  const [landmark, setLandmark] = useState<string>("");
  const [gpsConfirmed, setGpsConfirmed] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");
  const [photoAdded, setPhotoAdded] = useState<boolean>(false);

  useEffect(() => {
    if (isReportOpen) {
      setStep(1);
      setSelectedType(null);
      setLandmark("");
      setGpsConfirmed(false);
      setDescription("");
      setPhotoAdded(false);
    }
  }, [isReportOpen]);

  const handleClose = () => {
    setIsReportOpen(false);
  };

  const handleSendReport = () => {
    if (!selectedType) return;
    submitReport({
      type: selectedType,
      location,
      landmark,
      description,
    });
    setStep(4);
  };

  const handleBackToHome = () => {
    setIsReportOpen(false);
    navigate("/");
    showToast("Report received. Waiting for neighbours to confirm.", "success");
  };

  return (
    <BottomSheet
      isOpen={isReportOpen}
      onClose={handleClose}
      title="Report a Problem"
    >
      {step === 1 && (
        <div className="flex flex-col">
          <div className="mb-5">
            <h2 className="text-[20px] font-bold leading-[1.3] text-[#111827] mb-1">
              What's the problem?
            </h2>
            <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280]">
              Choose one
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {REPORT_TYPES.map((item, idx) => {
              const isSelected = selectedType === item.type;
              const isLastOdd =
                REPORT_TYPES.length % 2 === 1 && idx === REPORT_TYPES.length - 1;
              return (
                <div
                  key={item.type}
                  className={isLastOdd ? "col-span-2" : "col-span-1"}
                >
                  <Card
                    onClick={() => setSelectedType(item.type)}
                    ariaLabel={`Select ${item.label}`}
                    className={[
                      "p-2.5 flex flex-col gap-2 overflow-hidden transition-all duration-150 cursor-pointer group",
                      isSelected
                        ? "border-2 border-[#003DA5] ring-2 ring-[#003DA5]/20 bg-[#003DA5]/5"
                        : "hover:border-[#003DA5]/40",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <CategoryVisual
                      category={item.type}
                      variant="banner"
                      className="h-20 w-full"
                    />
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[14px] font-bold leading-[1.3] text-[#111827]">
                        {item.label}
                      </span>
                      {isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#003DA5]" />
                      )}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!selectedType}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col">
          <div className="mb-4">
            <h2 className="text-[20px] font-bold leading-[1.3] text-[#111827] mb-1">
              Confirm your location
            </h2>
            <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280]">
              We use this to match your report to neighbours
            </p>
          </div>

          {selectedType && (
            <div className="flex items-center gap-2.5 mb-4 p-2 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB]">
              <CategoryVisual category={selectedType} variant="avatar" />
              <span className="text-[13px] font-semibold text-[#111827]">
                Reporting: {INCIDENT_CATEGORY_NAMES[selectedType]} Issue
              </span>
            </div>
          )}

          {/* Map-preview card */}
          <div className="mb-4">
            <Card className="p-0 overflow-hidden bg-[#F7F8FA]">
              <div className="relative h-[128px] w-full flex items-center justify-center">
                <svg
                  className="absolute inset-0 w-full h-full text-[#E5E7EB]"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="report-map-grid"
                      width="16"
                      height="16"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="2" cy="2" r="1.5" fill="currentColor" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#report-map-grid)" />
                  <path
                    d="M 0 64 L 420 64 M 180 0 L 210 128"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#003DA5] text-[#FFFFFF] flex items-center justify-center shadow-lg ring-4 ring-[#003DA5]/20 animate-bounce">
                    <IconLocation size={20} />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-[#E5E7EB] bg-[#FFFFFF] flex items-center justify-between">
                <span className="text-[15px] font-medium leading-[1.5] text-[#111827]">
                  {location}
                </span>
                {gpsConfirmed && (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#00A651]">
                    <IconCheck size={16} /> GPS verified
                  </span>
                )}
              </div>
            </Card>
          </div>

          <div className="mb-4">
            <Input
              label="STREET OR LANDMARK"
              placeholder="e.g. 12 Mzamo Street"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setGpsConfirmed(true)}
            >
              {gpsConfirmed ? "Current location confirmed" : "Use my current location"}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(3)}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col">
          <div className="mb-5">
            <h2 className="text-[20px] font-bold leading-[1.3] text-[#111827] mb-1">
              Add details
            </h2>
            <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280]">
              Optional — helps responders prioritise
            </p>
          </div>

          <div className="mb-4">
            <Input
              label="WHAT DO YOU SEE?"
              placeholder="e.g. No power since 17:30, clinic fridge at risk"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <Card
              onClick={() => setPhotoAdded((prev) => !prev)}
              ariaLabel="Add a photo (Optional)"
              className={[
                "border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center",
                photoAdded
                  ? "border-[#00A651] bg-[#00A651]/5"
                  : "border-[#E5E7EB]",
              ].join(" ")}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                  photoAdded
                    ? "bg-[#00A651]/10 text-[#00A651]"
                    : "bg-[#F3F4F6] text-[#6B7280]"
                }`}
              >
                {photoAdded ? <IconCheck size={22} /> : <IconReport size={22} />}
              </div>
              <p className="text-[15px] font-normal leading-[1.5] text-[#111827]">
                {photoAdded ? "Photo attached (ward8_site.jpg)" : "Add a photo"}
              </p>
              <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280]">
                {photoAdded ? "Tap to remove" : "Optional"}
              </p>
            </Card>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="lg" onClick={() => setStep(2)} className="flex-1">
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleSendReport}
              className="flex-1"
            >
              Send report
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="py-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#00A651]/10 text-[#00A651] border border-[#00A651]/20 flex items-center justify-center mb-4 shadow-sm">
            <IconCheck size={32} />
          </div>
          <h1 className="text-[24px] font-bold tracking-[-0.01em] leading-[1.2] text-[#111827] mb-2">
            Report sent
          </h1>
          <p className="text-[15px] font-normal leading-[1.5] text-[#6B7280] mb-6 max-w-[300px]">
            We'll notify you when neighbours confirm. You'll get an update on WhatsApp or SMS.
          </p>
          <Button variant="primary" size="lg" fullWidth onClick={handleBackToHome}>
            Back to home
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
