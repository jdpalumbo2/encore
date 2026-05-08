import type { AllowedEventName } from "./db/schema";

const URL = "/api/track";

// Client-side helper. Posts to /api/track with sendBeacon when available
// (survives unload), falls back to fetch keepalive. No-ops on server.
export function track(eventName: AllowedEventName, payload?: unknown) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ eventName, payload });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(URL, blob);
      if (ok) return;
    }
    void fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Telemetry must never break the app.
  }
}
