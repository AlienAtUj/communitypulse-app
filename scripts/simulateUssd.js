#!/usr/bin/env node

/**
 * Interactive USSD Feature Phone Simulator
 * Simulates a resident without a smartphone dialing *134*911# to register or report emergencies.
 *
 * Usage:
 *   node scripts/simulateUssd.js [optional-phone-number]
 */

import readline from "readline";
import fs from "fs";
import path from "path";
import { handleUssdRequest } from "../server/ussdHandler.js";

// Load .env credentials if present
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

const phoneNumber = process.argv[2] || "+27829990001";
const sessionId = `SESSION_${Date.now()}`;
let userHistory = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function drawScreen(content) {
  console.log("\n==========================================");
  console.log("   NOKIA / FEATURE PHONE USSD DISPLAY     ");
  console.log(`   Resident Cell: ${phoneNumber}        `);
  console.log("------------------------------------------");
  for (const line of content.split("\n")) {
    console.log(`|  ${line}`);
  }
  console.log("==========================================\n");
}

async function step() {
  const textChain = userHistory.join("*");
  const response = await handleUssdRequest({
    sessionId,
    serviceCode: "*134*911#",
    phoneNumber,
    text: textChain,
  });

  if (response.startsWith("CON ")) {
    const menuBody = response.slice(4);
    drawScreen(menuBody);

    rl.question("Enter choice or text: ", (answer) => {
      if (!answer.trim()) {
        console.log("Session cancelled by user.");
        rl.close();
        return;
      }
      userHistory.push(answer.trim());
      step();
    });
  } else if (response.startsWith("END ")) {
    const finalMsg = response.slice(4);
    drawScreen(finalMsg);
    console.log("[USSD Session Completed Successfully]\n");
    rl.close();
  } else {
    drawScreen(response);
    rl.close();
  }
}

console.log("\nDialing *134*911# on non-smartphone network...");
step();

