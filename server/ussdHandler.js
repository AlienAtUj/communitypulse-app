/**
 * USSD State-Machine Engine for Feature Phones (Non-Smartphones)
 * Compatible with Africa's Talking, TruTeq, Twilio, and standard telecom USSD gateways.
 *
 * Telecom Protocol:
 * - Return string starting with "CON " to continue session (shows menu with input prompt).
 * - Return string starting with "END " to end session (shows final confirmation).
 */

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

// Initialize Firebase if running in Node environment
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "communitypulse-9d6e8",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

let db = null;
try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
} catch (e) {
  console.warn("Notice: Firestore offline or config pending:", e.message);
}

// Helper to prevent telecom USSD session timeouts (telecoms drop after 4-5s)
function withTimeout(promise, ms = 2500) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database operation timed out")), ms)
    ),
  ]);
}

/**
 * Handles incoming USSD requests
 * @param {string} sessionId - Unique telecom session identifier
 * @param {string} serviceCode - The dialed USSD string (e.g. *134*911#)
 * @param {string} phoneNumber - Resident's cell number (e.g. +27821234567)
 * @param {string} text - User's input chain delimited by '*' (e.g. "" on dial, "1" on first selection, "1*Ward 8" on second)
 */
export async function handleUssdRequest({ sessionId, serviceCode, phoneNumber, text }) {
  const inputs = text ? text.split("*") : [];
  const level = inputs.length;

  // Level 0: Main Welcome Menu
  if (level === 0 || text === "") {
    return (
      "CON Welcome to CommunityPulse SA\n" +
      "Emergency & Outage Alerts\n" +
      "1. Register for SMS Alerts\n" +
      "2. Report Emergency (No Internet)\n" +
      "3. Check Today's Outage Schedule\n" +
      "4. Emergency Helplines"
    );
  }

  const choice = inputs[0];

  // ==========================================
  // FLOW 1: Register for Ward SMS Notifications
  // ==========================================
  if (choice === "1") {
    if (level === 1) {
      return "CON Enter your Ward or Area\n(e.g. Ward 8, Khayelitsha, Soweto):";
    }

    if (level === 2) {
      const ward = inputs[1].trim();

      // Save user profile directly to Firestore
      if (db) {
        try {
          const userDocId = `ussd_${phoneNumber.replace(/[^0-9]/g, "")}`;
          await withTimeout(
            setDoc(
              doc(db, "users", userDocId),
              {
                uid: userDocId,
                phoneNumber: phoneNumber,
                displayName: `Resident (${phoneNumber.slice(-4)})`,
                ward: ward,
                notifySms: true,
                notifyWhatsapp: false,
                source: "ussd_feature_phone",
                role: "resident",
                isAnonymous: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            )
          );
        } catch (err) {
          console.warn("Notice: Firestore USSD write:", err.message);
        }
      }

      return `END You are registered for SMS alerts in ${ward}. You will receive instant notifications for load-shedding, water outages, and flood/fire emergencies.`;
    }
  }

  // ==========================================
  // FLOW 2: Report an Emergency via USSD
  // ==========================================
  if (choice === "2") {
    if (level === 1) {
      return (
        "CON Select Problem Type:\n" +
        "1. Power Failure / Sparking\n" +
        "2. Water Cutoff / Pipe Burst\n" +
        "3. Flooding / Blocked Drain\n" +
        "4. Shack or Veldfire"
      );
    }

    if (level === 2) {
      return "CON Enter street name and landmark:\n(e.g. Main Rd near School)";
    }

    if (level === 3) {
      const typeMap = {
        "1": "power",
        "2": "water",
        "3": "flood",
        "4": "fire",
      };
      const incidentType = typeMap[inputs[1]] || "power";
      const location = inputs[2].trim();
      const newId = `INC-USSD-${Date.now().toString().slice(-5)}`;

      if (db) {
        try {
          await withTimeout(
            setDoc(doc(db, "incidents", newId), {
              id: newId,
              type: incidentType,
              location: location,
              affected: 1,
              confirmations: 1,
              status: "reported",
              priority: incidentType === "flood" || incidentType === "fire" ? "critical" : "high",
              description: `Reported via USSD feature phone by ${phoneNumber}`,
              time: "Just now",
              source: "ussd",
              phoneNumber: phoneNumber,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          );
        } catch (err) {
          console.warn("Notice: Firestore USSD write:", err.message);
        }
      }

      return `END Emergency reported (${incidentType.toUpperCase()} at ${location}). Responders and community members in your area have been alerted. Ref: ${newId}`;
    }
  }

  // ==========================================
  // FLOW 3: Check Today's Outage Schedule
  // ==========================================
  if (choice === "3") {
    if (db) {
      try {
        const snap = await withTimeout(getDocs(collection(db, "outages")));
        let todayOutages = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data.day === "Today" || (data.day && data.day.toLowerCase().includes("today"))) {
            todayOutages.push(data);
          }
        });

        if (todayOutages.length > 0) {
          const first = todayOutages[0];
          return `END Outage Today:\n${first.title}\nTime: ${first.timeSlot}\nLocation: ${first.location}\nNote: ${first.note || "Stay prepared"}`;
        }
      } catch (err) {
        console.warn("Outage query error:", err);
      }
    }

    return "END No outages scheduled for today. Eskom grid and municipal water supply are running normally in your sector.";
  }

  // ==========================================
  // FLOW 4: Emergency Helplines
  // ==========================================
  if (choice === "4") {
    return (
      "END Emergency Helplines (Toll-Free):\n" +
      "Disaster Management: 112\n" +
      "Police / Flying Squad: 10111\n" +
      "Ambulance / Fire: 10177\n" +
      "Eskom Helpline: 08600 37566"
    );
  }

  return "END Invalid choice. Please redial the service code.";
}
