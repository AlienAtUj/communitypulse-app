/**
 * Automated SMS Outage & Emergency Dispatcher
 *
 * Scans Firestore for residents registered in an affected ward (via USSD or Web)
 * and dispatches Twilio SMS alerts to their mobile phones.
 */

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

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

const accountSid =
  process.env.VITE_TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
const authToken =
  process.env.VITE_TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
const smsFromNumber =
  process.env.VITE_TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER;

/**
 * Normalizes phone number to E.164 format (+27...)
 */
function formatToE164(phone) {
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0")) return `+27${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

/**
 * Sends a single SMS message via Twilio REST API
 */
async function sendSms(toPhone, message) {
  if (!accountSid || !authToken || !smsFromNumber) {
    console.warn(`[SMS Mock] To: ${toPhone} | Message: ${message}`);
    return { success: true, mock: true };
  }

  const normalizedTo = formatToE164(toPhone);

  try {
    const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const body = new URLSearchParams({
      To: normalizedTo,
      From: smsFromNumber,
      Body: message,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    const data = await res.json();
    return { success: res.ok, sid: data.sid, error: data.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Broadcast an emergency or outage SMS alert to all residents registered in a specific ward
 * @param {string} targetWard - e.g. "Ward 8" or "Khayelitsha"
 * @param {string} alertMessage - Message text
 */
export async function broadcastSmsToWard(targetWard, alertMessage) {
  if (!db) {
    console.warn("Database not connected. Cannot fetch ward recipients.");
    return { sentCount: 0 };
  }

  console.log(`\n[SMS Ward Broadcast] Querying residents in ${targetWard}...`);

  const recipients = [];

  try {
    const snap = await getDocs(collection(db, "users"));
    snap.forEach((d) => {
      const u = d.data();
      if (
        u.phoneNumber &&
        u.notifySms !== false &&
        u.ward &&
        (u.ward.toLowerCase().includes(targetWard.toLowerCase()) ||
          targetWard.toLowerCase().includes(u.ward.toLowerCase()))
      ) {
        recipients.push(u.phoneNumber);
      }
    });
  } catch (err) {
    console.error("Error querying ward residents:", err);
  }

  console.log(`Found ${recipients.length} registered feature phone residents in ${targetWard}.`);

  let sentCount = 0;
  for (const phone of recipients) {
    const res = await sendSms(phone, alertMessage);
    if (res.success) {
      sentCount++;
      console.log(`Sent SMS to ${phone} ${res.mock ? "(Mock)" : "(Twilio)"}`);
    } else {
      console.error(`Failed to send SMS to ${phone}:`, res.error);
    }
  }

  return { total: recipients.length, sentCount };
}

