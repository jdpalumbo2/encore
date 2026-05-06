"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { IntakeAnswers, Package } from "@/lib/types";
import { cn } from "@/lib/cn";

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

    const cachedRaw = sessionStorage.getItem("encore.packages");
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

    const intakeRaw = sessionStorage.getItem("encore.intake");
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
        sessionStorage.setItem("encore.packages", JSON.stringify(data.packages));
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
      <section className="mx-auto w-full max-w-[720px] px-6 py-32 text-center">
        <p className="font-display italic text-text-muted text-2xl animate-pulse">
          Crafting three options&hellip;
        </p>
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
        <p className="font-sans text-text-muted mt-3 max-w-[480px] mx-auto">
          {error}
        </p>
        <div className="mt-8">
          <Link
            href="/plan"
            className="inline-flex items-center justify-center bg-brass text-primary px-6 py-3 font-sans font-semibold tracking-[0.02em] hover:bg-brass-hover transition-colors rounded-sm"
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
        <p className="font-sans text-xs tracking-[0.22em] text-brass uppercase">
          Three options
        </p>
        <h1 className="font-display font-medium text-3xl sm:text-4xl text-primary mt-4 leading-tight">
          Pick the night you&rsquo;d like to have.
        </h1>
        <p className="font-sans text-text-muted mt-3 max-w-[560px]">
          Three different reads on the brief. Pick one for the full evening.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {packages.map((p) => (
          <PackageCard key={p.id} pkg={p} />
        ))}
      </div>

      <div className="mt-12">
        <Link
          href="/plan"
          className="font-sans text-sm text-text-muted hover:text-primary transition-colors rounded-sm"
        >
          &larr; Adjust the brief
        </Link>
      </div>
    </section>
  );
}

function PackageCard({ pkg }: { pkg: Package }) {
  return (
    <Link
      href={`/package/${pkg.id}`}
      className={cn(
        "group flex flex-col bg-background border border-hairline p-7 rounded-sm",
        "hover:border-primary transition-colors",
      )}
    >
      <h2 className="font-display font-medium text-2xl text-primary leading-tight">
        {pkg.title}
      </h2>
      <p className="font-display italic text-text-muted text-base mt-2 leading-snug">
        {pkg.headline}
      </p>

      <div className="mt-6 border-t border-hairline pt-5">
        <p className="font-sans text-xs uppercase tracking-[0.18em] text-text-muted">
          Where
        </p>
        <p className="font-sans text-text mt-2">
          <span className="font-semibold">{pkg.restaurant.name}</span>{" "}
          <span className="text-text-muted">
            &middot; {pkg.restaurant.neighborhood}
          </span>
        </p>
      </div>

      {pkg.experience && (
        <div className="mt-5">
          <p className="font-sans text-xs uppercase tracking-[0.18em] text-text-muted">
            And
          </p>
          <p className="font-sans text-text mt-2">{pkg.experience.name}</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {pkg.restaurant.vibe.slice(0, 3).map((v) => (
          <span
            key={v}
            className="font-sans text-[11px] uppercase tracking-[0.12em] text-brass border border-brass/60 px-2 py-1 rounded-sm"
          >
            {v}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-7 flex items-center justify-between">
        <p className="font-sans text-sm text-text-muted">{pkg.priceEstimate}</p>
        <p className="font-sans text-sm font-semibold text-primary group-hover:text-brass transition-colors">
          See the evening &rarr;
        </p>
      </div>
    </Link>
  );
}

function MissingBrief() {
  return (
    <section className="mx-auto w-full max-w-[640px] px-6 py-24 text-center">
      <p className="font-sans text-xs tracking-[0.22em] text-brass uppercase">
        Nothing to show
      </p>
      <p className="font-display font-medium text-3xl text-primary mt-4 leading-tight">
        We need a brief first.
      </p>
      <p className="font-sans text-text-muted mt-3 max-w-[440px] mx-auto">
        Five quick questions and you&rsquo;ll have three nights to pick from.
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
