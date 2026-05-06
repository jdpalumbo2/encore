"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Package } from "@/lib/types";

export default function PackagePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("encore.packages");
    if (!raw) {
      router.replace("/plan");
      return;
    }
    try {
      const list = JSON.parse(raw) as Package[];
      const found = list.find((p) => p.id === params.id);
      if (!found) {
        router.replace("/results");
        return;
      }
      setPkg(found);
    } catch {
      router.replace("/plan");
    } finally {
      setLoaded(true);
    }
  }, [params.id, router]);

  if (!loaded) return null;
  if (!pkg) return null;

  return (
    <article className="mx-auto w-full max-w-[720px] px-6 pt-12 pb-24">
      <Link
        href="/results"
        className="font-sans text-xs uppercase tracking-[0.18em] text-text-muted hover:text-primary transition-colors"
      >
        &larr; The other two
      </Link>

      <header className="mt-10">
        <p className="font-sans text-xs tracking-[0.22em] text-brass uppercase">
          {pkg.title}
        </p>
        <h1
          className="font-display text-4xl sm:text-5xl text-primary mt-4 leading-[1.05] tracking-[-0.005em]"
          style={{ fontWeight: 500 }}
        >
          {pkg.headline}
        </h1>
      </header>

      <Section label="The evening">
        <p className="font-display text-text text-xl leading-[1.5]">
          {pkg.narrative}
        </p>
      </Section>

      <Section label="Where">
        <div className="border border-hairline p-6">
          <h3
            className="font-display text-2xl text-primary leading-tight"
            style={{ fontWeight: 500 }}
          >
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
        <Section label={`And ${beforeOrAfter(pkg.experience.pairsWellWith)}`}>
          <div className="border border-hairline p-6">
            <h3
              className="font-display text-2xl text-primary leading-tight"
              style={{ fontWeight: 500 }}
            >
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
        <ul className="space-y-3">
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
          className="inline-flex items-center justify-center bg-brass text-primary px-8 py-4 font-sans font-semibold tracking-[0.02em] hover:bg-[#A8884A] transition-colors text-center"
          style={{ borderRadius: "2px" }}
        >
          Book this evening &middot; {pkg.priceEstimate}
        </Link>
        <Link
          href="/results"
          className="font-sans text-sm text-text-muted hover:text-primary transition-colors text-center"
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

function beforeOrAfter(pairs: string): string {
  const lower = pairs.toLowerCase();
  if (lower.startsWith("before")) return "before";
  if (lower.startsWith("after")) return "after";
  return "around it";
}
