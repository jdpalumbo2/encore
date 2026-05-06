"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Experience, Package } from "@/lib/types";

type LoadState =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "notfound" }
  | { kind: "ready"; pkg: Package };

export default function PackagePage() {
  const params = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    const raw = sessionStorage.getItem("encore.packages");
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
      document.title = `${found.title} · Encore`;
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
        className="font-sans text-xs uppercase tracking-[0.18em] text-text-muted hover:text-primary transition-colors rounded-sm py-1"
      >
        &larr; The other two
      </Link>

      <header className="mt-10">
        <p className="font-sans text-xs tracking-[0.22em] text-brass uppercase">
          {pkg.title}
        </p>
        <h1 className="font-display font-medium text-4xl sm:text-5xl text-primary mt-4 leading-[1.05]">
          {pkg.headline}
        </h1>
      </header>

      <Section label="The evening">
        <p className="font-display text-text text-xl leading-[1.5]">
          {pkg.narrative}
        </p>
      </Section>

      <Section label="Where">
        <div className="border border-hairline p-6 rounded-sm">
          <h3 className="font-display font-medium text-2xl text-primary leading-tight">
            {pkg.restaurant.name}
          </h3>
          <p className="font-sans text-sm text-text-muted mt-1">
            {pkg.restaurant.neighborhood} &middot; {pkg.restaurant.cuisine} &middot;{" "}
            {pkg.restaurant.priceTier}
          </p>
          <p className="font-display italic text-text mt-4 leading-relaxed">
            {pkg.restaurant.blurb}
          </p>
          <p className="font-sans text-sm text-text-muted mt-4 leading-relaxed">
            {pkg.restaurant.bestFor}
          </p>
          {pkg.restaurant.reservationNote && (
            <p className="font-sans text-xs text-text-muted mt-4 italic">
              {pkg.restaurant.reservationNote}
            </p>
          )}
        </div>
      </Section>

      {pkg.experience && (
        <Section label={experienceSectionLabel(pkg.experience)}>
          <div className="border border-hairline p-6 rounded-sm">
            <h3 className="font-display font-medium text-2xl text-primary leading-tight">
              {pkg.experience.name}
            </h3>
            <p className="font-sans text-sm text-text-muted mt-1">
              {pkg.experience.duration}
            </p>
            <p className="font-display italic text-text mt-4 leading-relaxed">
              {pkg.experience.blurb}
            </p>
            <p className="font-sans text-sm text-text-muted mt-4 leading-relaxed">
              {pkg.experience.logistics}
            </p>
          </div>
        </Section>
      )}

      <Section label="What to wear">
        <p className="font-sans text-text">{pkg.dressCode}</p>
      </Section>

      <Section label="Getting there">
        <p className="font-sans text-text">{pkg.parking}</p>
      </Section>

      <Section label="Two things to ask her about">
        <ul className="space-y-3 list-none pl-0">
          {pkg.conversationStarters.map((s, i) => (
            <li
              key={i}
              className="font-display italic text-text text-lg leading-snug pl-5 border-l border-brass"
            >
              {s}
            </li>
          ))}
        </ul>
      </Section>

      <Section label="One thing to skip tonight">
        <p className="font-sans text-text-muted">{pkg.dontBringUp}</p>
      </Section>

      <div className="mt-16 flex flex-col items-stretch gap-4">
        <Link
          href={`/confirm?packageId=${pkg.id}`}
          className="inline-flex items-center justify-center bg-brass text-primary px-8 py-4 font-sans font-semibold tracking-[0.02em] hover:bg-brass-hover transition-colors text-center rounded-sm"
        >
          Book this evening &middot; {pkg.priceEstimate}
        </Link>
        <Link
          href="/results"
          className="font-sans text-sm text-text-muted hover:text-primary transition-colors text-center rounded-sm py-1"
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
    <section className="mt-12">
      <p className="font-sans text-xs uppercase tracking-[0.18em] text-text-muted">
        {label}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function experienceSectionLabel(exp: Experience): string {
  const lower = exp.pairsWellWith.toLowerCase();
  if (lower.includes("after")) return "And after";
  if (lower.includes("before")) return "And before";
  if (exp.type === "walk" || exp.type === "cocktails") return "And after";
  return "And before";
}

function MissingState() {
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

function NotFoundState() {
  return (
    <section className="mx-auto w-full max-w-[640px] px-6 py-24 text-center">
      <p className="font-display font-medium text-3xl text-primary leading-tight">
        That one isn&rsquo;t in the set.
      </p>
      <p className="font-sans text-text-muted mt-3 max-w-[440px] mx-auto">
        Pick from the three on offer, or start a fresh brief.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          href="/results"
          className="inline-flex items-center justify-center bg-brass text-primary px-7 py-3 font-sans font-semibold tracking-[0.02em] hover:bg-brass-hover transition-colors rounded-sm"
        >
          Back to the three
        </Link>
        <Link
          href="/plan"
          className="font-sans text-sm text-text-muted hover:text-primary transition-colors rounded-sm py-1"
        >
          New brief
        </Link>
      </div>
    </section>
  );
}
