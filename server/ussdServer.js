/**
 * Live USSD Webhook Server for Feature Phone Residents
 * Uses native Node.js HTTP (Zero external dependencies).
 * Compatible with Africa's Talking, Twilio TwiML/Webhooks, and South African Telecom Gateways.
 */

import http from "http";
import fs from "fs";
import path from "path";
import { handleUssdRequest } from "./ussdHandler.js";

// Load .env variables
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

const PORT = process.env.USSD_PORT || 3001;

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (!body) {
        return resolve({});
      }
      try {
        // Try JSON
        return resolve(JSON.parse(body));
      } catch {
        // Fallback to URL-encoded form data (Standard telecom USSD gateway format)
        const params = new URLSearchParams(body);
        const obj = {};
        for (const [k, v] of params.entries()) {
          obj[k] = v;
        }
        return resolve(obj);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Health check
  if (url.pathname === "/" || url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "active",
        service: "CommunityPulse USSD Gateway",
        endpoint: "/api/ussd",
        ussdCode: "*134*911#",
      })
    );
    return;
  }

  // Live USSD Webhook Endpoint
  if (url.pathname === "/api/ussd" || url.pathname === "/ussd") {
    try {
      const body = await parseRequestBody(req);

      // Support Africa's Talking, Twilio, and query parameters
      const sessionId =
        body.sessionId || body.SessionId || url.searchParams.get("sessionId") || `SESS_${Date.now()}`;
      const serviceCode =
        body.serviceCode || body.ServiceCode || url.searchParams.get("serviceCode") || "*134*911#";
      const phoneNumber =
        body.phoneNumber || body.PhoneNumber || body.From || url.searchParams.get("phoneNumber") || "+27820000000";
      const text =
        body.text !== undefined
          ? body.text
          : body.Text !== undefined
          ? body.Text
          : url.searchParams.get("text") || "";

      const responseText = await handleUssdRequest({
        sessionId,
        serviceCode,
        phoneNumber,
        text,
      });

      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(responseText);
    } catch (err) {
      console.error("USSD Server Error:", err);
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("END System temporarily unavailable. Please try again later.");
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` CommunityPulse Live USSD Server Running on Port ${PORT}`);
  console.log(` Webhook URL: http://localhost:${PORT}/api/ussd`);
  console.log(`======================================================\n`);
});

