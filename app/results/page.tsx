"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { IntakeAnswers, Package } from "@/lib/types";
import { cn } from "@/lib/cn";
import { formatPriceEstimate, formatShape } from "@/lib/format";

export default function ResultsPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasIntake, setHasIntake] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const cachedRaw = sessionStorage.getItem("encore.packages.v2");
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as Package[];
        if (Array.isArray(cached) && cached.length > 0) {
          setPackages(cached);
          setLoading(false);
          return;
        }
      } catch {
        // fall through to fetch
      }
    }

    const intakeRaw = sessionStorage.getItem("encore.intake.v2");
    if (!intakeRaw) {
      setHasIntake(false);
      setLoading(false);
      return;
    }

    let intake: IntakeAnswers;
    try {
      intake = JSON.parse(intakeRaw) as IntakeAnswers;
    } catch {
      setHasIntake(false);
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        const res = await fetch("/api/curate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(intake),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error || "Something didn't take. Try the brief again.",
          );
        }
        const data = (await res.json()) as { packages: Package[] };
        sessionStorage.setItem("encore.packages.v2", JSON.stringify(data.packages));
        setPackages(data.packages);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Something didn't take. Try the brief again.",
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router]);

  if (loading) {
    return (
      <section
        className="mx-auto w-full max-w-[720px] px-6 py-32 text-center"
        aria-busy="true"
        aria-live="polite"
      >
        <p className="font-display italic text-text-muted text-2xl animate-pulse">
          Designing three evenings&hellip;
        </p>
        <p className="sr-only">Loading three options. This usually takes about ten seconds.</p>
      </section>
    );
  }

  if (!hasIntake) {
    return <MissingBrief />;
  }

  if (error) {
    return (
      <section className="mx-auto w-full max-w-[640px] px-6 py-24 text-center">
        <p className="font-display font-medium text-3xl text-primary">
          Try that again.
        </p>
        <p className="font-sans text-base text-text-muted mt-3 max-w-[480px] mx-auto leading-relaxed">
          {error}
        </p>
        <div className="mt-8">
          <Link
            href="/plan"
            className="inline-flex items-center justify-center bg-brass text-primary px-6 py-3 font-sans text-base font-semibold tracking-[0.02em] hover:bg-brass-hover transition-colors rounded-sm min-h-[48px]"
          >
            Back to the brief
          </Link>
        </div>
      </section>
    );
  }

  if (!packages) return null;

  return (
    <section className="mx-auto w-full max-w-[1100px] px-6 pt-16 pb-24">
      <div>
        <p className="font-sans text-[13px] tracking-[0.22em] text-brass-text uppercase">
          Three evenings
        </p>
        <h1 className="font-display font-medium text-3xl sm:text-4xl text-primary mt-4 leading-tight">
          Three different reads on the night.
        </h1>
        <p className="font-sans text-base sm:text-lg text-text-muted mt-3 max-w-[560px] leading-relaxed">
          Pick one to see the full sequence: rooms, pacing, what to ask her about.
        </p>
      </div>

      <ul className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 list-none p-0">
        {packages.map((p) => (
          <li key={p.id}>
            <PackageCard pkg={p} />
          </li>
        ))}
      </ul>

      <div className="mt-12">
        <Link
          href="/plan"
          className="inline-block font-sans text-base text-text-muted hover:text-primary transition-colors rounded-sm px-2 py-2 -mx-2"
        >
          &larr; Adjust the brief
        </Link>
      </div>
    </section>
  );
}

function PackageCard({ pkg }: { pkg: Package }) {
  const firstStage = pkg.stages[0];
  return (
    <Link
      href={`/package/${pkg.id}`}
      className={cn(
        "group flex flex-col h-full bg-background border border-hairline p-7 rounded-sm",
        "hover:border-primary transition-colors",
      )}
      aria-label={`${pkg.archetypeName}: ${pkg.headline}. ${formatPriceEstimate(pkg.priceEstimate)}.`}
    >
      <h2 className="font-display font-medium text-2xl text-primary leading-tight">
        {pkg.archetypeName}
      </h2>
      <p className="font-sans text-[12px] uppercase tracking-[0.18em] text-text-muted mt-3">
        {formatShape(pkg.stages)}
      </p>

      <p className="font-display italic text-text text-lg mt-5 leading-snug">
        {pkg.headline}
      </p>

      <div className="mt-5">
        <span className="inline-flex font-sans text-[12px] uppercase tracking-[0.14em] text-brass-text border border-brass/70 px-3 py-1.5 rounded-sm">
          {pkg.signal}
        </span>
      </div>

      {firstStage && (
        <div className="mt-6 border-t border-hairline pt-5">
          <p className="font-sans text-[12px] uppercase tracking-[0.18em] text-text-muted">
            Starts at
          </p>
          <p className="font-sans text-base text-text mt-2">
            <span className="font-semibold">{firstStage.venue.name}</span>{" "}
            <span className="text-text-muted">
              &middot; {firstStage.venue.neighborhood}
            </span>
          </p>
        </div>
      )}

      <div className="mt-auto pt-7 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="font-sans text-base text-text-muted">
          {formatPriceEstimate(pkg.priceEstimate)}
        </p>
        <p
          className="font-sans text-base font-semibold text-primary group-hover:text-brass-text transition-colors whitespace-nowrap"
          aria-hidden="true"
        >
          See the evening &rarr;
        </p>
      </div>
    </Link>
  );
}

function MissingBrief() {
  return (
    <section className="mx-auto w-full max-w-[640px] px-6 py-24 text-center">
      <p className="font-sans text-[13px] tracking-[0.22em] text-brass-text uppercase">
        Nothing to show
      </p>
      <p className="font-display font-medium text-3xl text-primary mt-4 leading-tight">
        We need a brief first.
      </p>
      <p className="font-sans text-base text-text-muted mt-3 max-w-[440px] mx-auto leading-relaxed">
        Five quick questions and you&rsquo;ll have three evenings to pick from.
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
