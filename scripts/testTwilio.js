#!/usr/bin/env node

/**
 * Twilio SMS & WhatsApp Diagnostic Test Script
 * Usage:
 *   node scripts/testTwilio.js [phone-number]
 * Example:
 *   node scripts/testTwilio.js +27821234567
 */

import fs from "fs";
import path from "path";

// Load .env if present
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...vals] = trimmed.split("=");
      const val = vals.join("=").replace(/^["']|["']$/g, "").trim();
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const accountSid =
  process.env.VITE_TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
const authToken =
  process.env.VITE_TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
const smsFromNumber =
  process.env.VITE_TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER;
const whatsappFromNumber =
  process.env.VITE_TWILIO_WHATSAPP_NUMBER ||
  process.env.TWILIO_WHATSAPP_NUMBER ||
  "whatsapp:+14155238886";

console.log("\n==========================================");
console.log("CommunityPulse - Twilio Notification Test");
console.log("==========================================\n");

if (!accountSid || !authToken) {
  console.error("ERROR: Missing Twilio credentials!");
  console.log("Please add your Twilio credentials to .env:");
  console.log("  VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  console.log("  VITE_TWILIO_AUTH_TOKEN=your_auth_token");
  console.log("  VITE_TWILIO_PHONE_NUMBER=+1234567890 (Twilio SMS number)");
  console.log("  VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886 (WhatsApp Sandbox)\n");
  process.exit(1);
}

function formatPhone(p) {
  const cleaned = p.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0")) return `+27${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

const targetPhoneRaw = process.argv[2] || process.env.TEST_PHONE_NUMBER;

if (!targetPhoneRaw) {
  console.log("Usage: node scripts/testTwilio.js <your-cell-phone-number>");
  console.log("Example: node scripts/testTwilio.js 0821234567\n");
  process.exit(1);
}

const targetPhone = formatPhone(targetPhoneRaw);
console.log(`Sending alerts to: ${targetPhone}`);
console.log(`Twilio Account SID: ${accountSid.slice(0, 6)}...${accountSid.slice(-4)}`);

async function sendTestMessage(channel) {
  const isWhatsApp = channel === "whatsapp";
  const to = isWhatsApp ? `whatsapp:${targetPhone}` : targetPhone;
  const from = isWhatsApp ? whatsappFromNumber : smsFromNumber;

  if (!from && !isWhatsApp) {
    console.warn(`[SMS] Skipped: VITE_TWILIO_PHONE_NUMBER not set in .env`);
    return;
  }

  const message = isWhatsApp
    ? `*CommunityPulse Live Alert*\nTesting WhatsApp broadcast from your community disaster hub! Municipal updates and emergency alerts will be delivered here.`
    : `[CommunityPulse Alert] Test emergency SMS broadcast. Ward 8 infrastructure and disaster updates verified.`;

  console.log(`\n[${channel.toUpperCase()}] Dispatching...`);

  try {
    const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const body = new URLSearchParams({
      To: to,
      From: from,
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
    if (!res.ok) {
      console.error(`[${channel.toUpperCase()}] FAILED:`, data.message || data);
    } else {
      console.log(`[${channel.toUpperCase()}] SUCCESS! Message SID: ${data.sid}`);
    }
  } catch (err) {
    console.error(`[${channel.toUpperCase()}] NETWORK ERROR:`, err.message);
  }
}

async function run() {
  await sendTestMessage("whatsapp");
  if (smsFromNumber) {
    await sendTestMessage("sms");
  }
  console.log("\nDiagnostic finished.\n");
}

run();

