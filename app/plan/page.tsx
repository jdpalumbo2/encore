"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition, type KeyboardEvent } from "react";
import type { IntakeAnswers } from "@/lib/types";
import { cn } from "@/lib/cn";

type Vibe = IntakeAnswers["vibe"];
type Budget = IntakeAnswers["budget"];

const VIBE_OPTIONS: { value: Vibe; label: string; sub: string }[] = [
  { value: "relaxed", label: "Relaxed dinner", sub: "Easy night, three courses, home before eleven." },
  { value: "special", label: "Special occasion", sub: "There's a reason on the calendar." },
  { value: "adventurous", label: "Adventurous", sub: "Something she'll tell her friends about." },
  { value: "classic", label: "Classic", sub: "Old-world. By the book, in the best sense." },
];

const BUDGET_OPTIONS: { value: Budget; label: string; sub: string }[] = [
  { value: "comfortable", label: "Comfortable", sub: "$150–$250 per person" },
  { value: "elevated", label: "Elevated", sub: "$250–$450 per person" },
  { value: "no-ceiling", label: "No ceiling", sub: "Make it count." },
];

export default function PlanPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const [herDescription, setHerDescription] = useState("");
  const [when, setWhen] = useState("");
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [avoid, setAvoid] = useState("");

  const total = 5;
  const canAdvance =
    (step === 1 && herDescription.trim().length > 3) ||
    (step === 2 && when.trim().length > 0) ||
    (step === 3 && vibe !== null) ||
    (step === 4 && budget !== null) ||
    step === 5;

  const next = () => {
    if (!canAdvance) return;
    if (step < total) startTransition(() => setStep(step + 1));
  };
  const back = () => {
    if (step > 1) startTransition(() => setStep(step - 1));
  };

  const submit = () => {
    if (!vibe || !budget) return;
    const answers: IntakeAnswers = {
      herDescription: herDescription.trim(),
      when: when.trim(),
      vibe,
      budget,
      avoid: avoid.trim() || undefined,
    };
    setSubmitting(true);
    sessionStorage.setItem("encore.intake", JSON.stringify(answers));
    sessionStorage.removeItem("encore.packages");
    router.push("/results");
  };

  const onTextKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canAdvance) {
      e.preventDefault();
      next();
    }
  };

  return (
    <section className="mx-auto w-full max-w-[640px] px-6 pt-16 pb-24">
      <div className="flex items-center justify-between font-sans text-xs tracking-[0.18em] uppercase text-text-muted">
        <div>
          {step > 1 ? (
            <button
              onClick={back}
              className="hover:text-primary transition-colors py-1 rounded-sm"
              type="button"
              disabled={submitting}
            >
              &larr; Back
            </button>
          ) : (
            <Link href="/" className="hover:text-primary transition-colors py-1 rounded-sm">
              &larr; Home
            </Link>
          )}
        </div>
        <div aria-live="polite">
          {step} of {total}
        </div>
      </div>

      <div
        key={step}
        className={cn(
          "mt-12 transition-opacity duration-200",
          pending ? "opacity-0" : "opacity-100",
        )}
      >
        {step === 1 && (
          <Step
            lead="Tell us about her."
            sub="A few lines is plenty. The more specific, the better the night."
          >
            <textarea
              autoFocus
              value={herDescription}
              onChange={(e) => setHerDescription(e.target.value)}
              placeholder="She's mid-50s, plays tennis, just got back from Aspen. Reads a lot of fiction. Doesn't drink red."
              aria-label="Tell us about her"
              className="w-full min-h-[160px] bg-background border border-hairline px-4 py-3 font-sans text-base text-text placeholder:text-text-muted/70 focus:outline-none focus:border-primary transition-colors resize-none rounded-sm"
            />
          </Step>
        )}

        {step === 2 && (
          <Step lead="When?" sub="Tomorrow, this weekend, or a date.">
            <input
              autoFocus
              type="text"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              onKeyDown={onTextKeyDown}
              placeholder="Saturday night"
              aria-label="When"
              className="w-full bg-background border border-hairline px-4 py-3 font-sans text-base text-text placeholder:text-text-muted/70 focus:outline-none focus:border-primary transition-colors rounded-sm"
            />
          </Step>
        )}

        {step === 3 && (
          <Step lead="What kind of night?" sub="Pick the one closest to it.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="What kind of night">
              {VIBE_OPTIONS.map((o) => {
                const selected = vibe === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setVibe(o.value)}
                    className={cn(
                      "text-left bg-background border px-5 py-4 transition-colors rounded-sm",
                      selected
                        ? "border-primary"
                        : "border-hairline hover:border-text-muted",
                    )}
                  >
                    <div className="font-display font-medium text-lg text-primary">
                      {o.label}
                    </div>
                    <div className="font-sans text-sm text-text-muted mt-1">
                      {o.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step lead="Budget comfort?" sub="Honest answer; we work better with the truth.">
            <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-label="Budget">
              {BUDGET_OPTIONS.map((o) => {
                const selected = budget === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setBudget(o.value)}
                    className={cn(
                      "text-left bg-background border px-5 py-4 transition-colors flex items-center justify-between gap-4 rounded-sm",
                      selected
                        ? "border-primary"
                        : "border-hairline hover:border-text-muted",
                    )}
                  >
                    <div className="font-display font-medium text-lg text-primary">
                      {o.label}
                    </div>
                    <div className="font-sans text-sm text-text-muted">{o.sub}</div>
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {step === 5 && (
          <Step
            lead="Anything to avoid?"
            sub="Optional. Dietary stuff, mobility, things she doesn't want to talk about."
          >
            <textarea
              autoFocus
              value={avoid}
              onChange={(e) => setAvoid(e.target.value)}
              placeholder="No oysters. Not crazy about loud rooms."
              aria-label="Anything to avoid"
              className="w-full min-h-[120px] bg-background border border-hairline px-4 py-3 font-sans text-base text-text placeholder:text-text-muted/70 focus:outline-none focus:border-primary transition-colors resize-none rounded-sm"
            />
          </Step>
        )}
      </div>

      <div className="mt-10 flex items-center justify-end">
        {step < total ? (
          <button
            type="button"
            onClick={next}
            disabled={!canAdvance}
            className={cn(
              "inline-flex items-center justify-center bg-brass text-primary px-7 py-3 font-sans font-semibold tracking-[0.02em] transition-colors rounded-sm",
              canAdvance ? "hover:bg-brass-hover" : "opacity-40 cursor-not-allowed",
            )}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className={cn(
              "inline-flex items-center justify-center bg-brass text-primary px-7 py-3 font-sans font-semibold tracking-[0.02em] transition-colors rounded-sm",
              submitting ? "opacity-60 cursor-wait" : "hover:bg-brass-hover",
            )}
          >
            {submitting ? "One moment…" : "See the three options"}
          </button>
        )}
      </div>
    </section>
  );
}

function Step({
  lead,
  sub,
  children,
}: {
  lead: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display font-medium text-3xl sm:text-4xl text-primary leading-tight">
        {lead}
      </h2>
      {sub && (
        <p className="font-sans text-sm text-text-muted mt-3 leading-relaxed">
          {sub}
        </p>
      )}
      <div className="mt-8">{children}</div>
    </div>
  );
}
