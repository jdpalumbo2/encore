"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/track";
import type { AllowedEventName } from "@/lib/db/schema";

interface Props {
  event: AllowedEventName;
  payload?: unknown;
}

// Fires `track(event, payload)` exactly once on mount. Use in server-component
// pages that don't otherwise need `'use client'`.
export function TrackOnMount({ event, payload }: Props) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(event, payload);
  }, [event, payload]);
  return null;
}
