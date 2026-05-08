"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Package } from "@/lib/types";
import { track } from "@/lib/track";

type LoadState =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "ready"; pkg: Package; when: string };

function ConfirmInner() {
  const searchParams = useSearchParams();
  const packageId = searchParams.get("packageId");
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    if (!packageId) {
      setState({ kind: "missing" });
      return;
    }
    const rawPkgs = sessionStorage.getItem("encore.packages.v2");
    if (!rawPkgs) {
      setState({ kind: "missing" });
      return;
    }
    try {
      const list = JSON.parse(rawPkgs) as Package[];
      const found = list.find((p) => p.id === packageId);
      if (!found) {
        setState({ kind: "missing" });
        return;
      }
      let when = "";
      const rawIntake = sessionStorage.getItem("encore.intake.v2");
      if (rawIntake) {
        try {
          const intake = JSON.parse(rawIntake) as { when?: string };
          when = (intake.when || "").trim();
        } catch {
          // ignore
        }
      }
      setState({ kind: "ready", pkg: found, when });
      track("booking.confirmed", { archetypeId: found.archetypeId });
      // Persist the booking row for the admin Kanban (Phase E).
      void fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archetypeId: found.archetypeId }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      setState({ kind: "missing" });
    }
  }, [packageId]);

  if (state.kind === "loading") return null;
  if (state.kind === "missing") return <MissingState />;

  const { pkg, when } = state;
  const whenLine = when || "Tonight at 7:30";
  const firstStage = pkg.stages[0];
  const lastStage = pkg.stages[pkg.stages.length - 1];

  return (
    <section className="mx-auto w-full max-w-[640px] px-6 pt-20 pb-24">
      <p className="font-sans text-[13px] tracking-[0.22em] text-brass-text uppercase">
        Confirmed
      </p>
      <h1 className="font-display font-medium text-5xl text-primary mt-5 leading-[1.05]">
        Your evening is held.
      </h1>

      <div className="mt-12 border border-hairline p-7 rounded-sm">
        <p className="font-sans text-[13px] uppercase tracking-[0.18em] text-text-muted">
          {pkg.archetypeName}
        </p>
        {firstStage && (
          <>
            <h2 className="font-display font-medium text-2xl text-primary mt-3 leading-tight">
              {firstStage.venue.name}
            </h2>
            <p className="font-sans text-base text-text-muted mt-1">
              {firstStage.venue.neighborhood}
            </p>
          </>
        )}
        <p className="font-sans text-lg text-text mt-5">{whenLine}</p>
        {pkg.stages.length > 1 && lastStage && (
          <p className="font-sans text-base text-text-muted mt-2">
            Ends with {lastStage.venue.name}.
          </p>
        )}
      </div>

      <p className="font-sans text-base text-text-muted mt-8 leading-relaxed">
        Everything you need is on the previous page. Read it once on the way over.
      </p>
      <p className="font-sans text-sm text-text-muted mt-3 italic leading-relaxed">
        A 7% concierge fee is included and will appear itemized on your bill at the venue.
      </p>
      <p className="font-display italic text-text-muted text-lg mt-4">Have fun.</p>

      <div className="mt-12">
        <Link
          href="/"
          className="inline-block font-sans text-base text-text-muted hover:text-primary transition-colors rounded-sm px-2 py-2 -mx-2"
        >
          Plan another evening &rarr;
        </Link>
      </div>
    </section>
  );
}

function MissingState() {
  return (
    <section className="mx-auto w-full max-w-[640px] px-6 py-24 text-center">
      <p className="font-display font-medium text-3xl text-primary leading-tight">
        Nothing to confirm yet.
      </p>
      <p className="font-sans text-base text-text-muted mt-3 max-w-[440px] mx-auto leading-relaxed">
        Start with a brief and pick a night first.
      </p>
      <div className="mt-8">
        <Link
          href="/plan"
          className="inline-flex items-center justify-center bg-brass text-primary px-7 py-3 font-sans text-base font-semibold tracking-[0.02em] hover:bg-brass-hover transition-colors rounded-sm min-h-[48px]"
        >
          Start the brief
        </Link>
      </div>
    </section>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto w-full max-w-[640px] px-6 py-32 text-center">
          <p className="font-display italic text-text-muted">Holding the table&hellip;</p>
        </section>
      }
    >
      <ConfirmInner />
    </Suspense>
  );
}
