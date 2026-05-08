# Follow-ups

Open notes after the admin dashboard ship (Phases A–F). v2 follow-ups verified or superseded are removed.

## Vercel preview env vars not set

`DATABASE_URL` and `ADMIN_PASSWORD` are set for **production** on Vercel, but `vercel env add ... preview` returned an opaque "hint" message and the values didn't land. PR previews would currently fail to render `/admin/*` and any DB-dependent page. Either set them via the Vercel dashboard for Preview, or set them after the next CLI bump.

## "The Off-Hours" name

Borderline corporate ("off-hours" is meeting-vocab). v2 voice review on real model output didn't flag it, so it survived the ship. If a future read across a wider variety of briefs surfaces it sticking out, candidates: "The Saturday Morning" (constrains to weekend) or "The Slow Saturday" (same constraint, more in voice).

## Retry corrective message could be smarter

`pickThreeArchetypes(received)` in `app/api/curate/route.ts` fills gaps from the eight archetypes in declaration order. If the model returns two The Classics and the brief is "athletic, weekend, no ceiling," the retry should bias the gap-fillers toward The Outing or The Big Swing rather than The Slow Morning. Today the gap-fill is purely positional.

## "The Off-Hours" name

Borderline corporate ("off-hours" is meeting-vocab). Not severe enough to rename mid-phase, but if a Phase 10 voice review on real model output flags it sticking out, candidates: "The Saturday Morning" (constrains to weekend) or "The Slow Saturday" (same constraint, more in voice).

## Retry corrective message could be smarter

`pickThreeArchetypes(received)` in `app/api/curate/route.ts` fills gaps from the eight archetypes in declaration order. If the model returns two The Classics and the brief is "athletic, weekend, no ceiling," the retry should bias the gap-fillers toward The Outing or The Big Swing rather than The Slow Morning. Today the gap-fill is purely positional. A future revision could weight by intake `vibe` and `budget`.

## Mobile

Stage blocks, transition notes, and the shape strip use single-column layouts and `max-w-` constraints, but have not been opened in a real device emulator. Worth a 30-second spot-check at 375px before sending to Rob: focus on the transition note centering, the order-number/time-of-evening row at the top of each stage block, and the signal pill on the detail hero.

## Admin dashboard items deferred

Specific to the round-1 admin scaffold:

- **No `/api/track` rate limit beyond size + allowlist.** A bored attacker could still flood `events` with valid event names. Add Upstash + token-bucket if traffic justifies it.
- **PII in `briefs.her_description` is verbatim.** Admin Basic Auth is the only access control. Decide before sharing the dashboard with anyone outside Rob whether to truncate, anonymize, or move into a separate stricter table.
- **Funnel doesn't deduplicate same-session repeated briefs.** A session that submits 3 briefs in a row counts as 1 session reaching `brief.submitted` (correct), but if you wanted "brief submission rate per session" the math is fine; if you wanted "% of *brief submissions* that became picks" the funnel SQL needs reshaping.
- **Heatmap window is hardcoded to 30 days.** Add a date-range selector if Rob wants to scope.
- **Bookings Kanban has no drag-and-drop.** Status advances via buttons. Drag would need `dnd-kit` or similar; not worth round-1 weight.
- **`/admin/_actions.ts` server actions assume Basic Auth in proxy.** Documented in the file's header. A future refactor that splits these out could drop that assumption silently. Worth re-reading the comment before any change.
- **Admin pages use `force-dynamic`** to bypass any caching. Each request hits the DB. Fine at this scale; revisit if response latencies grow.

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
