import React, { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { Logo } from "./Logo";
import { Input } from "./Input";
import { Button } from "./Button";
import { IconLocation, IconCheck } from "./icons";
import { useData } from "../context/DataContext";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "signin" | "signup";
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = "signup",
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ward, setWard] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notifySms, setNotifySms] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editWard, setEditWard] = useState("");
  const [isEditingAlerts, setIsEditingAlerts] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editSms, setEditSms] = useState(true);
  const [editWhatsapp, setEditWhatsapp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const {
    currentUser,
    signIn,
    signUp,
    updateUserLocation,
    updateUserPhoneAndAlerts,
    signOut,
    showToast,
  } = useData();

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
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
            const suburb =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.city_district ||
              "";
            const city = addr.city || addr.town || addr.municipality || "";
            const road = addr.road ? `${addr.road}, ` : "";

            const detected =
              [road + suburb, city].filter(Boolean).join(", ") ||
              `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setWard(detected);
            setEditWard(detected);
            showToast(`Location detected: ${detected}`, "success");
          } else {
            const fallback = `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setWard(fallback);
            setEditWard(fallback);
            showToast("GPS coordinates acquired", "info");
          }
        } catch {
          const fallback = `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setWard(fallback);
          setEditWard(fallback);
          showToast("GPS coordinates acquired", "info");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        showToast(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Please manually type where you stay below."
            : "Could not get GPS fix. Please enter manually.",
          "info"
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    const formattedEmail = email.includes("@")
      ? email.trim()
      : `${email.trim().replace(/\s+/g, "")}@communitypulse.za`;

    setIsLoading(true);
    try {
      if (mode === "signup") {
        await signUp(
          formattedEmail,
          password,
          name.trim(),
          ward.trim() || undefined,
          gpsCoords || undefined,
          phoneNumber.trim() || undefined,
          notifySms,
          notifyWhatsapp
        );
      } else {
        await signIn(formattedEmail, password);
      }
      onClose();
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      const code = errObj.code || "";
      if (code === "auth/email-already-in-use") {
        setErrorMessage("An account with this email already exists. Try signing in.");
      } else if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setErrorMessage("Invalid email or password.");
      } else if (code === "auth/weak-password") {
        setErrorMessage("Password should be at least 6 characters.");
      } else {
        setErrorMessage(errObj.message || "Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUpdatedLocation = async () => {
    if (!editWard.trim()) return;
    setIsLoading(true);
    try {
      await updateUserLocation(editWard.trim(), gpsCoords || undefined);
      setIsEditingLocation(false);
    } catch {
      showToast("Error updating location", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotificationPrefs = async () => {
    setIsLoading(true);
    try {
      await updateUserPhoneAndAlerts({
        phoneNumber: editPhone.trim(),
        notifySms: editSms,
        notifyWhatsapp: editWhatsapp,
      });
      setIsEditingAlerts(false);
    } catch {
      showToast("Error updating notification preferences", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={currentUser ? "Account & Location" : mode === "signup" ? "Create Account" : "Sign In"}
    >
      <div className="flex flex-col items-center">
        {/* Brand Logo & Title */}
        <Logo size="lg" variant="stacked" showTagline className="mb-5" />

        {currentUser ? (
          // Authenticated State View with Clear Location Information
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#003DA5]/10 text-[#003DA5] font-black text-2xl flex items-center justify-center mb-2">
                {(currentUser.displayName || "R").charAt(0).toUpperCase()}
              </div>
              <h3 className="text-[18px] font-bold text-[#111827]">
                {currentUser.displayName || "Resident"}
              </h3>
              <p className="text-[13px] text-[#6B7280]">
                {currentUser.email || "Guest Resident Session"}
              </p>
            </div>

            {/* Display Location Information */}
            <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                  <IconLocation size={14} className="text-[#003DA5]" />
                  Your Location
                </span>
                {!isEditingLocation && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditWard(currentUser.ward || "");
                      setIsEditingLocation(true);
                    }}
                    className="text-[12px] font-bold text-[#003DA5] underline cursor-pointer"
                  >
                    Change
                  </button>
                )}
              </div>

              {!isEditingLocation ? (
                <>
                  <p className="text-[15px] font-bold text-[#111827]">
                    {currentUser.ward || "No location saved yet"}
                  </p>
                  {currentUser.coordinates && (
                    <p className="text-[12px] text-[#6B7280]">
                      GPS Coordinates: {currentUser.coordinates.lat.toFixed(4)},{" "}
                      {currentUser.coordinates.lng.toFixed(4)}
                    </p>
                  )}
                  {currentUser.ward && (
                    <button
                      type="button"
                      onClick={() => {
                        const q = currentUser.coordinates
                          ? `${currentUser.coordinates.lat},${currentUser.coordinates.lng}`
                          : encodeURIComponent(currentUser.ward || "");
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${q}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                      className="text-[12px] text-[#003DA5] font-semibold underline text-left mt-1 cursor-pointer"
                    >
                      View on Google Maps
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-2.5 pt-1">
                  <Input
                    label="Ward or Suburb"
                    placeholder="e.g. Ward 8, Section C, Sandton..."
                    value={editWard}
                    onChange={(e) => setEditWard(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    disabled={isLocating}
                    onClick={handleDetectLocation}
                  >
                    {isLocating ? "Acquiring GPS fix..." : "Use My Current GPS Location"}
                  </Button>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      className="flex-1"
                      onClick={() => setIsEditingLocation(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      className="flex-1"
                      disabled={isLoading || !editWard.trim()}
                      onClick={handleSaveUpdatedLocation}
                    >
                      Save Location
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp & SMS Notification Preferences */}
            <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#6B7280]">
                  WhatsApp &amp; SMS Alerts
                </span>
                {!isEditingAlerts && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditPhone(currentUser.phoneNumber || "");
                      setEditSms(currentUser.notifySms !== false);
                      setEditWhatsapp(currentUser.notifyWhatsapp !== false);
                      setIsEditingAlerts(true);
                    }}
                    className="text-[12px] font-bold text-[#003DA5] underline cursor-pointer"
                  >
                    Manage
                  </button>
                )}
              </div>

              {!isEditingAlerts ? (
                <div className="flex flex-col gap-1 text-[13px]">
                  <p className="font-semibold text-[#111827]">
                    Cell: {currentUser.phoneNumber || "No number registered yet"}
                  </p>
                  <div className="flex items-center gap-2 text-[12px] text-[#4B5563] mt-0.5">
                    <span className={`inline-flex items-center gap-1 font-bold ${currentUser.notifySms !== false ? "text-[#00A651]" : "text-[#9CA3AF]"}`}>
                      <IconCheck size={14} /> SMS Alerts {currentUser.notifySms !== false ? "On" : "Off"}
                    </span>
                    <span>&bull;</span>
                    <span className={`inline-flex items-center gap-1 font-bold ${currentUser.notifyWhatsapp !== false ? "text-[#00A651]" : "text-[#9CA3AF]"}`}>
                      <IconCheck size={14} /> WhatsApp {currentUser.notifyWhatsapp !== false ? "On" : "Off"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 pt-1">
                  <Input
                    label="Mobile Number"
                    placeholder="e.g. 082 123 4567 or +27..."
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-[13px] text-[#111827] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editSms}
                      onChange={(e) => setEditSms(e.target.checked)}
                      className="w-4 h-4 accent-[#003DA5] rounded"
                    />
                    <span>Receive instant SMS for urgent emergencies</span>
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-[#111827] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.checked)}
                      className="w-4 h-4 accent-[#00A651] rounded"
                    />
                    <span>Receive WhatsApp updates for load-shedding &amp; repairs</span>
                  </label>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      className="flex-1"
                      onClick={() => setIsEditingAlerts(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      className="flex-1"
                      disabled={isLoading}
                      onClick={handleSaveNotificationPrefs}
                    >
                      Save Preferences
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full pt-2 flex flex-col gap-2">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                disabled={isLoading}
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        ) : (
          // Sign In / Create Account Form
          <>
            {/* Mode Toggle Switch */}
            <div className="w-full flex bg-[#F7F8FA] p-1 rounded-xl border border-[#E5E7EB] mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMessage("");
                }}
                className={`flex-1 py-2 text-[14px] font-bold rounded-lg transition-all cursor-pointer ${
                  mode === "signin"
                    ? "bg-[#FFFFFF] text-[#003DA5] shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMessage("");
                }}
                className={`flex-1 py-2 text-[14px] font-bold rounded-lg transition-all cursor-pointer ${
                  mode === "signup"
                    ? "bg-[#FFFFFF] text-[#003DA5] shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                Create Account
              </button>
            </div>

            {errorMessage && (
              <div className="w-full mb-3 p-3 rounded-xl bg-[#E4002B]/10 border border-[#E4002B]/20 text-[#E4002B] text-[13px] leading-tight">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5">
              {mode === "signup" && (
                <>
                  <Input
                    label="Full Name"
                    placeholder="e.g. Sandile Khumalo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  {/* Location Detection & Entry Section */}
                  <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB]">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-[#111827]">
                        Where Do You Stay?
                      </span>
                      {gpsCoords && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00A651] bg-[#00A651]/10 px-2 py-0.5 rounded-full">
                          <IconCheck size={12} /> GPS Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#6B7280]">
                      Auto-detect your location or type manually. This ensures you receive outage alerts and emergency updates for your area.
                    </p>

                    <Button
                      type="button"
                      variant={gpsCoords ? "secondary" : "primary"}
                      size="md"
                      fullWidth
                      disabled={isLocating}
                      onClick={handleDetectLocation}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <IconLocation size={15} />
                        {isLocating
                          ? "Detecting location..."
                          : gpsCoords
                          ? "Re-detect Location (GPS)"
                          : "Find Where I Stay (Use GPS)"}
                      </span>
                    </Button>

                    <Input
                      label="Or enter manually (Ward / Suburb / Street)"
                      placeholder="e.g. Section C, Ward 8, Khayelitsha"
                      value={ward}
                      onChange={(e) => {
                        setWard(e.target.value);
                      }}
                    />

                    {/* Display Location Information */}
                    {ward && (
                      <div className="mt-1 p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] text-[12px]">
                        <p className="font-bold text-[#111827] flex items-center gap-1.5">
                          <IconLocation size={14} className="text-[#003DA5]" />
                          <span>Selected: {ward}</span>
                        </p>
                        {gpsCoords && (
                          <div className="flex items-center justify-between mt-1 text-[#6B7280]">
                            <span>
                              Lat: {gpsCoords.lat.toFixed(4)}, Lng: {gpsCoords.lng.toFixed(4)} (±{gpsAccuracy}m)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const url = `https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`;
                                window.open(url, "_blank", "noopener,noreferrer");
                              }}
                              className="text-[#003DA5] font-semibold underline cursor-pointer"
                            >
                              Maps
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* WhatsApp & SMS Notification Setup */}
                  <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB]">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-[#111827]">
                      SMS &amp; WhatsApp Notifications
                    </span>
                    <p className="text-[12px] text-[#6B7280]">
                      Get notified directly on your phone when outages occur or emergencies are reported in your area.
                    </p>
                    <Input
                      label="Mobile Phone Number (Optional)"
                      placeholder="e.g. 082 123 4567 or +2782..."
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <div className="flex flex-col gap-1.5 pt-1">
                      <label className="flex items-center gap-2 text-[12px] text-[#111827] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifySms}
                          onChange={(e) => setNotifySms(e.target.checked)}
                          className="w-4 h-4 accent-[#003DA5] rounded"
                        />
                        <span>Send me SMS alerts for critical emergencies</span>
                      </label>
                      <label className="flex items-center gap-2 text-[12px] text-[#111827] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifyWhatsapp}
                          onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                          className="w-4 h-4 accent-[#00A651] rounded"
                        />
                        <span>Send me WhatsApp updates for load-shedding &amp; restorations</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              <Input
                label="Email or Mobile"
                placeholder="you@example.co.za or 0821234567"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="pt-2 flex flex-col gap-2.5">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Connecting to Firebase..."
                    : mode === "signup"
                    ? "Create Account"
                    : "Sign In"}
                </Button>
              </div>

              <p className="text-center text-[11px] text-[#6B7280] mt-1">
                Verified resident accounts prevent false updates and keep community reports reliable.
              </p>
            </form>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
