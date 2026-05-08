"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Package, PackageStage } from "@/lib/types";
import { formatPriceEstimate, formatStageOrder, stageLabel } from "@/lib/format";
import { track } from "@/lib/track";

type LoadState =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "notfound" }
  | { kind: "ready"; pkg: Package };

export default function PackagePage() {
  const params = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    const raw = sessionStorage.getItem("encore.packages.v2");
    if (!raw) {
      setState({ kind: "missing" });
      return;
    }
    try {
      const list = JSON.parse(raw) as Package[];
      const found = list.find((p) => p.id === params.id);
      if (!found) {
        setState({ kind: "notfound" });
        return;
      }
      setState({ kind: "ready", pkg: found });
      document.title = `${found.archetypeName} · Encore`;
      track("package.selected", { archetypeId: found.archetypeId });
    } catch {
      setState({ kind: "missing" });
    }
  }, [params.id]);

  if (state.kind === "loading") return null;
  if (state.kind === "missing") return <MissingState />;
  if (state.kind === "notfound") return <NotFoundState />;

  const pkg = state.pkg;

  return (
    <article className="mx-auto w-full max-w-[720px] px-6 pt-12 pb-24">
      <Link
        href="/results"
        className="inline-block font-sans text-[13px] uppercase tracking-[0.18em] text-text-muted hover:text-primary transition-colors rounded-sm px-2 py-2 -mx-2"
      >
        &larr; The other two
      </Link>

      <header className="mt-10">
        <p className="font-sans text-[13px] tracking-[0.22em] text-brass-text uppercase">
          {pkg.archetypeName}
        </p>
        <h1 className="font-display font-medium text-4xl sm:text-5xl text-primary mt-4 leading-[1.05]">
          {pkg.headline}
        </h1>
        <div className="mt-5">
          <span className="inline-flex font-sans text-[13px] uppercase tracking-[0.14em] text-brass-text border border-brass/70 px-3 py-1.5 rounded-sm">
            {pkg.signal}
          </span>
        </div>
      </header>

      <Section label="The evening">
        <p className="font-display text-text text-xl sm:text-[22px] leading-[1.55]">
          {pkg.narrative}
        </p>
      </Section>

      <Section label="The sequence">
        <ol className="mt-2 list-none p-0 space-y-0">
          {pkg.stages.map((stage, i) => (
            <li key={stage.order}>
              <StageBlock stage={stage} />
              {i < pkg.stages.length - 1 && stage.transition && (
                <div className="my-7 flex items-start justify-center gap-2 max-w-[420px] mx-auto">
                  <span
                    className="text-brass-text leading-none mt-[6px]"
                    aria-hidden="true"
                  >
                    &bull;
                  </span>
                  <p className="font-display italic text-text-muted text-base text-center leading-relaxed">
                    {stage.transition}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ol>
      </Section>

      <Section label="Two things to ask her about">
        <ul className="space-y-3 list-none pl-0">
          {pkg.conversationStarters.map((s, i) => (
            <li
              key={i}
              className="font-display italic text-text text-xl leading-snug pl-5 border-l-2 border-brass"
            >
              {s}
            </li>
          ))}
        </ul>
      </Section>

      <Section label="One thing to skip tonight">
        <p className="font-sans text-base text-text-muted leading-relaxed">
          {pkg.dontBringUp}
        </p>
      </Section>

      <Section label="What this evening costs">
        <p className="font-display font-medium text-2xl text-primary">
          {formatPriceEstimate(pkg.priceEstimate)}
        </p>
        <p className="font-sans text-sm text-text-muted mt-2 italic leading-relaxed">
          {pkg.priceEstimate.conciergeFeeNote}
        </p>
      </Section>

      <div className="mt-16 flex flex-col items-stretch gap-4">
        <Link
          href={`/confirm?packageId=${pkg.id}`}
          className="inline-flex items-center justify-center bg-brass text-primary px-8 py-4 font-sans text-base font-semibold tracking-[0.02em] hover:bg-brass-hover transition-colors text-center rounded-sm min-h-[52px]"
        >
          Book this evening &middot; {formatPriceEstimate(pkg.priceEstimate)}
        </Link>
        <Link
          href="/results"
          className="font-sans text-base text-text-muted hover:text-primary transition-colors text-center rounded-sm py-2"
        >
          See the other two
        </Link>
      </div>
    </article>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12" aria-labelledby={`section-${label.replace(/\s+/g, "-").toLowerCase()}`}>
      <h2
        id={`section-${label.replace(/\s+/g, "-").toLowerCase()}`}
        className="font-sans text-[13px] uppercase tracking-[0.18em] text-text-muted font-normal"
      >
        {label}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StageBlock({ stage }: { stage: PackageStage }) {
  const venue = stage.venue;
  const practical = [venue.dressCode, venue.parking].filter(Boolean).join(" · ");
  return (
    <div className="border border-hairline p-6 rounded-sm">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span
          className="font-sans text-[13px] tracking-[0.18em] text-brass-text font-semibold"
          aria-label={`Stage ${stage.order}`}
        >
          {formatStageOrder(stage.order)}
        </span>
        <span className="font-sans text-[13px] uppercase tracking-[0.18em] text-text-muted">
          {stageLabel(stage.kind)}
        </span>
        <span className="font-sans text-sm text-text-muted ml-auto">
          {stage.timeOfEvening}
        </span>
      </div>
      <h3 className="font-display font-medium text-2xl text-primary leading-tight mt-3">
        {venue.name}
      </h3>
      <p className="font-sans text-sm text-text-muted mt-1">
        {venue.neighborhood} &middot; {venue.priceTier} &middot; {venue.typicalDuration}
      </p>
      <p className="font-display italic text-text-muted text-lg mt-4 leading-relaxed">
        {stage.why}
      </p>
      <p className="font-sans text-base text-text-muted mt-3 leading-relaxed">
        {venue.blurb}
      </p>
      {practical && (
        <p className="font-sans text-sm text-text-muted mt-4 leading-relaxed">
          {practical}
        </p>
      )}
      {venue.reservationNote && (
        <p className="font-sans text-sm text-text-muted mt-2 italic leading-relaxed">
          {venue.reservationNote}
        </p>
      )}
    </div>
  );
}

function MissingState() {
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

function NotFoundState() {
  return (
    <section className="mx-auto w-full max-w-[640px] px-6 py-24 text-center">
      <p className="font-display font-medium text-3xl text-primary leading-tight">
        That one isn&rsquo;t in the set.
      </p>
      <p className="font-sans text-base text-text-muted mt-3 max-w-[440px] mx-auto leading-relaxed">
        Pick from the three on offer, or start a fresh brief.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
        <Link
          href="/results"
          className="inline-flex items-center justify-center bg-brass text-primary px-7 py-3 font-sans text-base font-semibold tracking-[0.02em] hover:bg-brass-hover transition-colors rounded-sm min-h-[48px]"
        >
          Back to the three
        </Link>
        <Link
          href="/plan"
          className="font-sans text-base text-text-muted hover:text-primary transition-colors rounded-sm px-2 py-2"
        >
          New brief
        </Link>
      </div>
    </section>
  );
}
