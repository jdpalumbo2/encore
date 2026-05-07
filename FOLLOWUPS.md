# Follow-ups

Open notes after Phases 7–10 of v2. Anything resolved is no longer listed here.

## Live API: still unverified end-to-end from this machine

`ANTHROPIC_API_KEY` was not available locally during any phase of this build. The v2 curation engine has not been exercised against a real model. After the key is set on Vercel, walk the flow once and confirm:

1. Three packages come back, each with a distinct `archetypeId`.
2. Every stage has a hydrated `venue` object and the venue's `category` is compatible with the stage `kind`.
3. The narrative reads in voice (no "curated," "perfect for," "crafted," em dashes).
4. The conversation starters are full sentences he could say out loud, not topic headers.
5. The signal phrase is 2–4 words and tuned to her, not just the archetype's default.
6. Day-of-week awareness lands at least once across a few runs (e.g., a Wednesday Buccan note, a Thursday Norton note).

The graceful error path is wired up if the key is missing or the call fails.

## Variety check not run

Phase 10's variety check (three sample briefs, verify the system selects from a meaningful subset of the eight archetypes across runs) has not been done — same blocker as above. After the key is set, run:

- "Athletic, just back from Aspen, plays tennis."
- "She reads a lot, late 60s, recently widowed."
- "Younger, ~40, works in finance, doesn't drink."

If the system always picks The Classic, tighten the system prompt's "ARCHETYPE SELECTION RULES" with a stronger spread directive.

## "The Off-Hours" name

Borderline corporate ("off-hours" is meeting-vocab). Not severe enough to rename mid-phase, but if a Phase 10 voice review on real model output flags it sticking out, candidates: "The Saturday Morning" (constrains to weekend) or "The Slow Saturday" (same constraint, more in voice).

## Retry corrective message could be smarter

`pickThreeArchetypes(received)` in `app/api/curate/route.ts` fills gaps from the eight archetypes in declaration order. If the model returns two The Classics and the brief is "athletic, weekend, no ceiling," the retry should bias the gap-fillers toward The Outing or The Big Swing rather than The Slow Morning. Today the gap-fill is purely positional. A future revision could weight by intake `vibe` and `budget`.

## Mobile

Stage blocks, transition notes, and the shape strip use single-column layouts and `max-w-` constraints, but have not been opened in a real device emulator. Worth a 30-second spot-check at 375px before sending to Rob: focus on the transition note centering, the order-number/time-of-evening row at the top of each stage block, and the signal pill on the detail hero.

## v1 sessionStorage keys still readable in long-lived tabs

Bumping to `.v2` keys means a user with v1 in their sessionStorage just re-fetches into v2 shapes. But if a user has `/results` open in a tab from before the deploy and refreshes, they hit the new code reading the new key — old key is ignored, intake is missing, they bounce to `/plan`. Acceptable for a one-stakeholder demo. Real product would also clean up the old keys on detection.

## `document.title` workaround

`/package/[id]` updates `document.title` to `${pkg.archetypeName} · Encore` in a `useEffect` because the page is a client component reading sessionStorage. Server-side `generateMetadata` can't access the package data without a real backend. If/when packages move to a server-side store keyed by an opaque id, switch to `generateMetadata`.

## Day-of-week awareness is only a prompt nudge

The system prompt asks the model to weave practical day-of-week lines into `why` or `transition` copy when relevant. There's no structured `dayOfWeek` field on `IntakeAnswers` or on venues, so the model is inferring from her brief's "when" string. If this drifts (e.g., the model says "Norton has Thursday hours" when the user said Saturday), tighten the prompt or pre-parse the `when` field server-side and inject a structured day-of-week into the user prompt.

## Prompt tokens per request

The system prompt is large. With 30 venues + 8 archetypes inlined as JSON plus the new field guidance and examples, the prompt is in the ~6–8k token range. Two calls (first + retry) can hit 16k+ input tokens. Per Anthropic pricing this is fine for a demo but will matter at scale. If the volume ever becomes real, consider trimming venue blurbs in the inlined JSON or moving to a leaner per-venue summary.

## ESLint set-state-in-effect rule still disabled

React 19's `react-hooks/set-state-in-effect` rule is disabled for `app/**/*.tsx` in `eslint.config.mjs`. Same rationale as v1: the legitimate sessionStorage→React-state-on-mount pattern is the right shape for client-only data. The cleanest long-term fix would be `useSyncExternalStore` over a sessionStorage subscription, but it adds complexity that isn't worth it for a demo.

## Favicon, mobile-app icons

`public/favicon.svg` is a brass "E" on navy. No `apple-touch-icon`, no PNG fallbacks. Acceptable for a demo.

## CI / lint pipeline

`npm run build` and `npm run lint` are clean as of the v2 ship. Adding both to a CI step would prevent regressions; not wired up.
