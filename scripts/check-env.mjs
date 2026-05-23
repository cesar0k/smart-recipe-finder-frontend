/**
 * Validates required environment variables before dev/build.
 * Run automatically via `predev` and `prebuild` npm hooks.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Required vars and their descriptions
const REQUIRED = {
  VITE_API_URL: "Backend API URL (e.g. http://localhost:8001)",
  VITE_WS_URL:
    "Notifications WebSocket base URL — same origin as the API, ws/wss scheme " +
    "(e.g. ws://localhost:8001 for dev, wss://your-domain for prod behind a reverse proxy)",
};

// Parse .env file if it exists
const envFile = resolve(ROOT, ".env");
const envVars = {};

if (existsSync(envFile)) {
  const content = readFileSync(envFile, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key) envVars[key.trim()] = rest.join("=").trim();
  }
} else {
  console.error("\n\x1b[31m✖ .env file not found!\x1b[0m");
  console.error(
    `  Copy \x1b[33m.env.example\x1b[0m to \x1b[33m.env\x1b[0m and fill in the required values:\n`
  );
  for (const [key, desc] of Object.entries(REQUIRED)) {
    console.error(`  \x1b[33m${key}\x1b[0m — ${desc}`);
  }
  console.error();
  process.exit(1);
}

// Check each required var
const missing = Object.entries(REQUIRED).filter(([key]) => !envVars[key]);

if (missing.length > 0) {
  console.error("\n\x1b[31m✖ Missing required environment variables in .env:\x1b[0m\n");
  for (const [key, desc] of missing) {
    console.error(`  \x1b[33m${key}\x1b[0m — ${desc}`);
  }
  console.error(
    `\n  Edit \x1b[33m.env\x1b[0m (copy from \x1b[33m.env.example\x1b[0m if needed)\n`
  );
  process.exit(1);
}

console.log("\x1b[32m✔ Environment OK\x1b[0m");
