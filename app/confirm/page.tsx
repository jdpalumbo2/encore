"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Package } from "@/lib/types";

function ConfirmInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get("packageId");
  const [pkg, setPkg] = useState<Package | null>(null);
  const [intakeWhen, setIntakeWhen] = useState<string>("");

  useEffect(() => {
    if (!packageId) {
      router.replace("/");
      return;
    }
    const rawPkgs = sessionStorage.getItem("encore.packages");
    const rawIntake = sessionStorage.getItem("encore.intake");
    if (!rawPkgs) {
      router.replace("/");
      return;
    }
    try {
      const list = JSON.parse(rawPkgs) as Package[];
      const found = list.find((p) => p.id === packageId);
      if (!found) {
        router.replace("/");
        return;
      }
      setPkg(found);
      if (rawIntake) {
        try {
          const intake = JSON.parse(rawIntake) as { when?: string };
          setIntakeWhen(intake.when || "");
        } catch {
          // ignore
        }
      }
    } catch {
      router.replace("/");
    }
  }, [packageId, router]);

  if (!pkg) return null;

  const whenLine = intakeWhen.trim() || "Tonight at 7:30";

  return (
    <section className="mx-auto w-full max-w-[640px] px-6 pt-20 pb-24">
      <p className="font-sans text-xs tracking-[0.22em] text-brass uppercase">
        Confirmed
      </p>
      <h1
        className="font-display text-5xl text-primary mt-5 leading-[1.05] tracking-[-0.01em]"
        style={{ fontWeight: 500 }}
      >
        Your table is held.
      </h1>

      <div className="mt-12 border border-hairline p-7">
        <p className="font-sans text-xs uppercase tracking-[0.18em] text-text-muted">
          {pkg.title}
        </p>
        <h2
          className="font-display text-2xl text-primary mt-3 leading-tight"
          style={{ fontWeight: 500 }}
        >
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
        We&rsquo;ll text you a calendar invite and the night-of details.
      </p>
      <p className="font-display italic text-text-muted mt-2">Have fun.</p>

      <div className="mt-12">
        <Link
          href="/"
          className="font-sans text-sm text-text-muted hover:text-primary transition-colors"
        >
          Plan another evening &rarr;
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
