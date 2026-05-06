"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Package } from "@/lib/types";

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
    const rawPkgs = sessionStorage.getItem("encore.packages");
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
      const rawIntake = sessionStorage.getItem("encore.intake");
      if (rawIntake) {
        try {
          const intake = JSON.parse(rawIntake) as { when?: string };
          when = (intake.when || "").trim();
        } catch {
          // ignore
        }
      }
      setState({ kind: "ready", pkg: found, when });
    } catch {
      setState({ kind: "missing" });
    }
  }, [packageId]);

  if (state.kind === "loading") return null;
  if (state.kind === "missing") return <MissingState />;

  const { pkg, when } = state;
  const whenLine = when || "Tonight at 7:30";

  return (
    <section className="mx-auto w-full max-w-[640px] px-6 pt-20 pb-24">
      <p className="font-sans text-xs tracking-[0.22em] text-brass uppercase">
        Confirmed
      </p>
      <h1 className="font-display font-medium text-5xl text-primary mt-5 leading-[1.05]">
        Your table is held.
      </h1>

      <div className="mt-12 border border-hairline p-7 rounded-sm">
        <p className="font-sans text-xs uppercase tracking-[0.18em] text-text-muted">
          {pkg.title}
        </p>
        <h2 className="font-display font-medium text-2xl text-primary mt-3 leading-tight">
          {pkg.restaurant.name}
        </h2>
        <p className="font-sans text-text-muted mt-1">
          {pkg.restaurant.neighborhood}
        </p>
        <p className="font-sans text-text mt-5">{whenLine}</p>
        {pkg.experience && (
          <p className="font-sans text-text-muted text-sm mt-2">
            With {pkg.experience.name}.
          </p>
        )}
      </div>

      <p className="font-sans text-text-muted mt-8 leading-relaxed">
        Everything you need is on the previous page. Read it once on the way over.
      </p>
      <p className="font-display italic text-text-muted mt-2">Have fun.</p>

      <div className="mt-12">
        <Link
          href="/"
          className="font-sans text-sm text-text-muted hover:text-primary transition-colors rounded-sm py-1"
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
      <p className="font-sans text-text-muted mt-3 max-w-[440px] mx-auto">
        Start with a brief and pick a night first.
      </p>
      <div className="mt-8">
        <Link
          href="/plan"
          className="inline-flex items-center justify-center bg-brass text-primary px-7 py-3 font-sans font-semibold tracking-[0.02em] hover:bg-brass-hover transition-colors rounded-sm"
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
