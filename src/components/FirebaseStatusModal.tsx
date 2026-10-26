import React, { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import { IconCheck, IconClose } from "./icons";
import { isFirebaseConfigured, db } from "../lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { purgeMockDataFromDb } from "../lib/firestoreService";
import { useData } from "../context/DataContext";

export interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FirebaseStatusModal({ isOpen, onClose }: FirebaseStatusModalProps) {
  const { incidents, showToast } = useData();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    docId?: string;
  } | null>(null);

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

  const runLiveTest = async () => {
    setTesting(true);
    setTestResult(null);

    const startTime = performance.now();

    try {
      if (!isFirebaseConfigured || !db) {
        throw new Error(
          "Firebase credentials not found in .env. Create a .env file with your project keys."
        );
      }

      // Query live Firestore to verify active connection without fake records
      const q = query(collection(db, "resources"), limit(1));
      const snap = await getDocs(q);

      const elapsed = Math.round(performance.now() - startTime);

      setTestResult({
        success: true,
        message: `Successfully connected to Cloud Firestore! Verified ${snap.size} records reachable.`,
        latencyMs: elapsed,
      });

      showToast(`Live database verified! Latency: ${elapsed}ms`, "success");
    } catch (err: unknown) {
      const errObj = err as Error;
      setTestResult({
        success: false,
        message: errObj.message || "Failed to reach Firestore.",
      });
      showToast("Live database test failed. Check .env", "error");
    } finally {
      setTesting(false);
    }
  };

  const [purging, setPurging] = useState(false);

  const handlePurgeMockData = async () => {
    setPurging(true);
    try {
      const { purgedCount } = await purgeMockDataFromDb();
      showToast(
        purgedCount > 0
          ? `Purged ${purgedCount} mock records from database!`
          : "Cache cleared. App is running on 100% real community data.",
        "success"
      );
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (e) {
      showToast("Error clearing mock records", "error");
    } finally {
      setPurging(false);
    }
  };

  const clearLocalCache = () => {
    try {
      localStorage.removeItem("cp_real_incidents");
      localStorage.removeItem("cp_real_outages");
      localStorage.removeItem("cp_real_resources");
      localStorage.removeItem("cp_real_alert");
      localStorage.removeItem("cp_real_ngo_offers");
      showToast("Local cache cleared. Refreshing real data...", "info");
      window.location.reload();
    } catch {
      // ignore
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Backend & Database Status">
      <div className="flex flex-col gap-4">
        {/* Header Summary */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#F7F8FA] border border-[#E5E7EB]">
          <div
            className={`w-4 h-4 rounded-full ${
              isFirebaseConfigured ? "bg-[#00A651] shadow-[0_0_8px_#00A651]" : "bg-[#FF9500]"
            } shrink-0`}
          />
          <div>
            <h3 className="text-[16px] font-bold text-[#111827]">
              {isFirebaseConfigured ? "Live Firebase Active" : "Setup Required: Add .env"}
            </h3>
            <p className="text-[12px] text-[#6B7280]">
              {isFirebaseConfigured
                ? `Project: ${projectId || "Connected"}`
                : "App is currently in offline mode because no .env was found."}
            </p>
          </div>
        </div>

        {/* Real Data Counter */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] text-center">
            <span className="text-[22px] font-black text-[#003DA5]">
              {incidents.length}
            </span>
            <p className="text-[12px] text-[#6B7280] mt-0.5">Real Incidents</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] text-center">
            <span className="text-[22px] font-black text-[#00A651]">
              {isFirebaseConfigured ? "Live" : "Offline"}
            </span>
            <p className="text-[12px] text-[#6B7280] mt-0.5">Database Mode</p>
          </div>
        </div>

        {/* Live Diagnostic Test Result */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-[13px] ${
              testResult.success
                ? "bg-[#00A651]/10 border-[#00A651]/30 text-[#00A651]"
                : "bg-[#E4002B]/10 border-[#E4002B]/30 text-[#E4002B]"
            }`}
          >
            <div className="font-bold mb-1 flex items-center gap-1.5">
              {testResult.success ? (
                <>
                  <IconCheck size={16} />
                  <span>Connection Verified</span>
                </>
              ) : (
                <>
                  <IconClose size={16} />
                  <span>Connection Failed</span>
                </>
              )}
            </div>
            <div>{testResult.message}</div>
            {testResult.latencyMs && (
              <div className="text-[12px] mt-1 opacity-80">
                Response Time: {testResult.latencyMs}ms
              </div>
            )}
          </div>
        )}

        {/* Test Connection Button */}
        <div className="flex flex-col gap-2 pt-1">
          <Button
            variant="primary"
            size="md"
            fullWidth
            disabled={testing}
            onClick={runLiveTest}
          >
            {testing ? "Testing live connection..." : "Run Live Database Test"}
          </Button>

          <Button
            variant="ghost"
            size="md"
            fullWidth
            disabled={purging}
            onClick={handlePurgeMockData}
          >
            {purging ? "Purging demo data..." : "Purge Mock / Demo Records"}
          </Button>

          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={clearLocalCache}
          >
            Clear Local Cache
          </Button>
        </div>

        {/* How to configure guide */}
        {!isFirebaseConfigured && (
          <div className="mt-2 p-3.5 rounded-xl bg-[#FFF9E6] border border-[#FFE082] text-[12px] text-[#7A5800]">
            <p className="font-bold mb-1">How to enable live Firestore now:</p>
            <p className="mb-2">
              Create a file named <code>.env</code> in your project directory and add your Firebase credentials:
            </p>
            <pre className="p-2 rounded bg-[#FFFFFF] border border-[#FFE082] font-mono text-[11px] overflow-x-auto text-[#111827]">
{`VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-app-id"
VITE_FIREBASE_STORAGE_BUCKET="your-app.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:1234567890:web:abcdef"`}
            </pre>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

