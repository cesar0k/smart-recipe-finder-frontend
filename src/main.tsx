import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { AuthProvider } from "./lib/auth/auth-context.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./lib/i18n.ts";

// ── .env validation ──────────────────────────────────────────────────────────
const REQUIRED_ENV: Record<string, string> = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
};

const missingVars = Object.entries(REQUIRED_ENV)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missingVars.length > 0) {
  document.body.innerHTML = `
    <div style="font-family:monospace;padding:2rem;color:#b91c1c;background:#fef2f2;min-height:100vh">
      <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem">
        ⚠️ Missing environment variables
      </h2>
      <p style="margin-bottom:0.5rem">
        Copy <code>.env.example</code> to <code>.env</code> and fill in:
      </p>
      <ul style="list-style:disc;padding-left:1.5rem">
        ${missingVars.map((v) => `<li><code>${v}</code></li>`).join("")}
      </ul>
    </div>`;
  throw new Error(`Missing env vars: ${missingVars.join(", ")}`);
}

// ── Preconnect to API origin ──────────────────────────────────────────────────
const apiUrl = import.meta.env.VITE_API_URL;
try {
  const origin = new URL(apiUrl).origin;
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = origin;
  document.head.appendChild(link);
} catch {
  // invalid URL format — caught at runtime, dev will see network errors
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
