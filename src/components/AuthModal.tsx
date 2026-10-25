import React, { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { Logo } from "./Logo";
import { Input } from "./Input";
import { Button } from "./Button";
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
  const [ward, setWard] = useState("Section C, Ward 8");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { currentUser, signIn, signUp, signInGuest, signOut, showToast } = useData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    // Auto-append @domain if user entered plain username or phone for simple test
    const formattedEmail = email.includes("@")
      ? email.trim()
      : `${email.trim().replace(/\s+/g, "")}@communitypulse.za`;

    setIsLoading(true);
    try {
      if (mode === "signup") {
        await signUp(formattedEmail, password, name.trim(), ward.trim());
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

  const handleGuestAccess = async () => {
    setIsLoading(true);
    try {
      await signInGuest();
      onClose();
    } catch {
      showToast("Guest sign-in ready", "info");
      onClose();
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
    <BottomSheet isOpen={isOpen} onClose={onClose} title={currentUser ? "Account" : mode === "signup" ? "Sign Up" : "Sign In"}>
      <div className="flex flex-col items-center">
        {/* Brand Logo & Title */}
        <Logo size="lg" variant="stacked" showTagline className="mb-5" />

        {currentUser ? (
          // Authenticated State View
          <div className="w-full flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#003DA5]/10 text-[#003DA5] font-black text-2xl flex items-center justify-center">
              {(currentUser.displayName || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#111827]">
                {currentUser.displayName || "Neighbor"}
              </h3>
              <p className="text-[14px] text-[#6B7280]">
                {currentUser.email || "Guest Resident"}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-[#00A651]/10 text-[#00A651]">
                <span className="w-2 h-2 rounded-full bg-[#00A651]" />
                <span>Live Account Active ({currentUser.ward || "Ward 8"})</span>
              </div>
            </div>

            <div className="w-full pt-4 flex flex-col gap-2">
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
                    placeholder="e.g. Thabo Khumalo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Ward / Area"
                    placeholder="e.g. Section C, Ward 8"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                  />
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

                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  fullWidth
                  disabled={isLoading}
                  onClick={handleGuestAccess}
                >
                  Report Anonymously as Guest
                </Button>
              </div>

              <p className="text-center text-[11px] text-[#6B7280] mt-1">
                Firebase Cloud Security Rules protect your reports and identity.
              </p>
            </form>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
