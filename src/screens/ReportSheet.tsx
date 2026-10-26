import React, { useState, useEffect } from "react";
import { IncidentType, INCIDENT_CATEGORY_NAMES } from "../lib/data";
import { useData } from "../context/DataContext";
import { BottomSheet } from "../components/BottomSheet";
import { Card } from "../components/Card";
import { CategoryVisual } from "../components/CategoryVisual";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { AuthModal } from "../components/AuthModal";
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
  const { currentUser, isReportOpen, setIsReportOpen, submitReport, showToast, navigate } = useData();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [location, setLocation] = useState<string>(
    () => currentUser?.ward || "Section C, Ward 8"
  );
  const [landmark, setLandmark] = useState<string>("");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isReportOpen) {
      setStep(1);
      setSelectedType(null);
      setLandmark("");
      setGpsCoords(null);
      setGpsAccuracy(null);
      setLocationError("");
      setDescription("");
      setPhotoPreview(null);
      if (currentUser?.ward) {
        setLocation(currentUser.ward);
      }
    }
  }, [isReportOpen, currentUser?.ward]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser/device.");
      return;
    }

    setIsLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setGpsAccuracy(Math.round(accuracy));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const street = addr.road || addr.pedestrian || addr.suburb || "";
            const houseNum = addr.house_number ? `${addr.house_number} ` : "";
            const suburb =
              addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || "";
            const city = addr.city || addr.town || addr.municipality || "";

            const detectedLocation =
              [suburb, city].filter(Boolean).join(", ") ||
              `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            const detectedLandmark =
              [houseNum + street, addr.amenity].filter(Boolean).join(" near ") || "";

            if (detectedLocation) setLocation(detectedLocation);
            if (detectedLandmark && !landmark) {
              setLandmark(detectedLandmark);
            }
            showToast(`Accurate GPS location verified (+/- ${Math.round(accuracy)}m)`, "success");
          } else {
            showToast(`GPS coordinates captured (+/- ${Math.round(accuracy)}m)`, "info");
          }
        } catch {
          showToast(`GPS coordinates captured (+/- ${Math.round(accuracy)}m)`, "info");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Location permission denied. Please type your street and area manually below."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Position unavailable. Please enter your location manually.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Please enter your location manually.");
            break;
          default:
            setLocationError("Unable to acquire GPS location. Please enter manually.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleClose = () => {
    setIsReportOpen(false);
  };

  
const handleSendReport = async () => {
  if (!currentUser || currentUser.isAnonymous) {
    showToast("Verified account required to submit a report.", "error");
    setIsAuthOpen(true);
    return;
  }

  if (!selectedType) return;

  try {
    await submitReport({
      type: selectedType,
      location: location.trim() || currentUser.ward || "Local Ward",
      landmark: landmark.trim(),
      description: description.trim(),
      coordinates: gpsCoords || undefined,
      accuracy: gpsAccuracy || undefined,
    });

    // Only show the confirmation screen after saving succeeds.
    setStep(4);
  } catch (error) {
    // The error message is already handled by submitReport.
    console.error("Report submission failed:", error);
  }
};


  const handleBackToHome = () => {
    setIsReportOpen(false);
    navigate("/");
    showToast("Report received. Waiting for neighbours to confirm.", "success");
  };

  const isGuest = !currentUser || currentUser.isAnonymous;

  return (
    <>
      <BottomSheet
        isOpen={isReportOpen}
        onClose={handleClose}
        title="Report a Problem"
      >
        {isGuest ? (
          <div className="py-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#003DA5]/10 text-[#003DA5] border border-[#003DA5]/20 flex items-center justify-center mb-4 shadow-sm">
              <IconReport size={32} />
            </div>
            <h2 className="text-[20px] font-bold leading-[1.3] text-[#111827] mb-2">
              Verified Account Required
            </h2>
            <p className="text-[14px] leading-[1.5] text-[#6B7280] mb-6 max-w-[320px]">
              To prevent false updates and keep community reports verified for emergency services, residents must sign in or register before reporting.
            </p>
            <div className="w-full flex flex-col gap-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setIsAuthOpen(true)}
              >
                Sign In or Create Account
              </Button>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
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
              Accurate address and coordinates ensure emergency responders and neighbours locate the problem.
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

          {/* GPS Detector Card */}
          <div className="mb-4">
            <Card className="p-4 bg-[#F7F8FA] border border-[#E5E7EB]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      gpsCoords
                        ? "bg-[#00A651]/10 text-[#00A651]"
                        : "bg-[#003DA5]/10 text-[#003DA5]"
                    }`}
                  >
                    <IconLocation size={20} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-[#111827]">
                      {gpsCoords ? "Exact GPS Coordinates Locked" : "Device GPS Location"}
                    </h4>
                    <p className="text-[11px] text-[#6B7280]">
                      {gpsCoords
                        ? `Lat: ${gpsCoords.lat.toFixed(5)}, Lng: ${gpsCoords.lng.toFixed(5)} (±${gpsAccuracy}m)`
                        : "Detect high-precision coordinates from your device"}
                    </p>
                  </div>
                </div>
                {gpsCoords && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00A651] bg-[#00A651]/10 px-2.5 py-1 rounded-full">
                    <IconCheck size={14} /> GPS Verified
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant={gpsCoords ? "secondary" : "primary"}
                  size="md"
                  fullWidth
                  disabled={isLocating}
                  onClick={handleDetectGPS}
                >
                  {isLocating
                    ? "Acquiring GPS fix..."
                    : gpsCoords
                    ? "Refresh My GPS Location"
                    : "Detect My Exact GPS Location"}
                </Button>

                {gpsCoords && (
                  <button
                    type="button"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                    className="text-[12px] text-[#003DA5] font-semibold underline text-center py-1 cursor-pointer"
                  >
                    View exact pin in Google Maps
                  </button>
                )}
              </div>

              {locationError && (
                <div className="mt-2.5 p-2 rounded-lg bg-[#E4002B]/10 text-[#E4002B] text-[12px]">
                  {locationError}
                </div>
              )}
            </Card>
          </div>

          {/* Editable Area and Landmark Fields */}
          <div className="flex flex-col gap-3.5 mb-6">
            <Input
              label="WARD / SUBURB / AREA"
              placeholder="e.g. Section C, Ward 8, Khayelitsha"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <Input
              label="STREET ADDRESS OR LANDMARK"
              placeholder="e.g. 14 Mzamo Street, near Primary School"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!location.trim()}
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
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            {photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] bg-[#F7F8FA]">
                <img
                  src={photoPreview}
                  alt="Incident evidence"
                  className="w-full h-44 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 px-3 py-1 bg-[#111827]/85 hover:bg-[#111827] text-[#FFFFFF] text-[12px] font-bold rounded-full backdrop-blur-sm cursor-pointer transition-colors shadow-md"
                >
                  Remove Photo
                </button>
              </div>
            ) : (
              <Card
                onClick={() => photoInputRef.current?.click()}
                ariaLabel="Take photo or attach from gallery"
                className="border-2 border-dashed border-[#CBD5E1] hover:border-[#003DA5] rounded-2xl p-6 text-center flex flex-col items-center justify-center cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 bg-[#F1F5F9] text-[#003DA5]">
                  <IconReport size={22} />
                </div>
                <p className="text-[15px] font-semibold text-[#111827]">
                  Take a photo or upload
                </p>
                <p className="text-[12px] text-[#6B7280]">
                  Supports phone camera and gallery
                </p>
              </Card>
            )}
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
          </>
        )}
      </BottomSheet>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
