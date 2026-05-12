# DISCOVERY-NOTES.md

Audit notebook before the v3 phase. Findings, gaps, and the architectural forks that surfaced.

---

## Audit scope and method

Read the existing docs first (`CLAUDE.md`, `Buildplan.md`, `BUILDPLAN-V2.md`, `FOLLOWUPS.md`, `README.md`), then walked the codebase in the order specified by the v3 prompt: `package.json`, `app/`, `app/api/`, `lib/`, `components/`, configuration, state flow, and infrastructure presence/absence. After the audit, cross-referenced findings against the May 11 conversation between Rob and Johnny.

---

## Dependencies (`package.json`)

Runtime deps that matter to scope discussions:

- `@anthropic-ai/sdk` — curation engine. Sonnet 4.6 hardcoded as `MODEL` in `app/api/curate/route.ts`.
- `drizzle-orm` + `postgres` driver — telemetry storage. Railway-hosted Postgres.
- `@vercel/functions` — used for `waitUntil` in API routes so DB writes survive serverless function exit.
- `next 16.2.5`, `react 19.2.4`, `tailwindcss 4`, `shadcn`, `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`.

Deps that are **notably absent**:

- No email service (no Resend, SendGrid, Postmark, nodemailer, SMTP integration).
- No SMS service (no Twilio, no Vonage).
- No calendar / ICS generation library.
- No payment infrastructure (no Stripe, no Stripe Connect).
- No auth library beyond the hand-rolled Basic Auth in `proxy.ts` (admin only).
- No rate limiter (no Upstash, no `@vercel/edge-config`).
- No KV / Redis / blob storage.
- No analytics (no PostHog, no Plausible, no Vercel Analytics).
- No voice / audio (no ElevenLabs SDK, no WebRTC, no transcription).
- No image storage / upload (no Vercel Blob, no S3 SDK).

This matters: anything Rob wants in the "post-date follow-up email" direction requires us to add at least one new external service. Today the product has zero outbound communication capability.

---

## Routes (`app/`)

Customer-facing pages:

- `/` (`app/page.tsx`) — server component. Landing hero, brass eyebrow, "Plan the night" CTA, three static specimen cards. Fires `landing.viewed` via a tiny `<TrackOnMount>` client component. No images, no marketing footer.
- `/plan` (`app/plan/page.tsx`) — client component. Five-step intake form (her description, when, vibe, budget, avoid). Fires `plan.started` on mount, `brief.submitted` on submit. Writes `IntakeAnswers` to `sessionStorage["encore.intake.v2"]` and routes to `/results`.
- `/results` (`app/results/page.tsx`) — client component. Reads intake from sessionStorage, POSTs to `/api/curate`, writes the returned `Package[]` to `sessionStorage["encore.packages.v2"]`, renders three cards. Has empty-state for direct navigation (no brief).
- `/package/[id]` (`app/package/[id]/page.tsx`) — client component. Reads package list from sessionStorage, finds by `archetypeId` (which equals `package.id`), renders the full sequence detail. Fires `package.selected` with `{ archetypeId }`. Sets `document.title` in a `useEffect`.
- `/confirm` (`app/confirm/page.tsx`) — client component, wrapped in `<Suspense>` because of `useSearchParams`. Reads the package ID from the `packageId` query param, hydrates from sessionStorage, fires `booking.confirmed`, and POSTs to `/api/bookings` to persist a booking row. Shows the concierge-fee disclosure.

Admin-facing pages (Basic Auth gated by `proxy.ts`):

- `/admin` — overview tiles (briefs 7d, funnel %, top archetype 7d, bookings pending, spend 24h).
- `/admin/briefs` — paginated table of every submitted brief. Truncates `her_description` for at-a-glance; full text on row expand. Now renders timestamps in `America/New_York`.
- `/admin/funnel` — last 24h and last 7d funnel side-by-side.
- `/admin/heatmap` — archetype + venue shown-vs-picked bars over 30 days.
- `/admin/bookings` — three-column Kanban (Pending / Contacted / Confirmed) with status-advance buttons and per-card notes; uses server actions.
- `/admin/costs` — token cost tracker, daily breakdown table in Eastern.

Layout files (`layout.tsx` per route) carry per-route metadata but otherwise just pass children through.

---

## API routes (`app/api/`)

- `POST /api/curate` — accepts `IntakeAnswers`, calls Anthropic with the system prompt built from venues + archetypes, enforces JSON via tool use, hydrates server-side, retries once on archetype collision, returns `{ packages: Package[] }`. Persists telemetry to `briefs`, `packages`, `model_calls` via `waitUntil`. Reads `encore_sid` cookie for session id. Length caps on free-text inputs.
- `POST /api/track` — accepts `{ eventName, payload }`. Validates `eventName` against `ALLOWED_EVENT_NAMES`. Caps payload at 2KB. Persists to `events`. Side effect: when `eventName === "package.selected"`, also flips the matching package's `selected_at` for the heatmap.
- `POST /api/bookings` — accepts `{ archetypeId }`. Looks up the most recent package for this session + archetype. Inserts a `bookings` row with `status: "pending"`. Idempotent — won't double-insert if `/confirm` mounts twice.

**No other API routes exist.** Specifically: no `/api/email`, no `/api/share`, no `/api/feedback`, no `/api/operators`.

---

## `lib/`

- `lib/types.ts` — `Venue`, `Archetype`, `PackageStage`, `Package`, `IntakeAnswers`, plus enum types. `IntakeAnswers` collects `herDescription`, `when`, `vibe`, `budget`, `avoid?`. **No email field, no phone field, no contact info field.**
- `lib/seed-data.ts` — 28 venues across 11 categories + 8 archetypes. Hand-written blurbs in Encore voice.
- `lib/encore-prompt.ts` — system prompt + user prompt + retry prompt builders. Inlines the full venue + archetype JSON. Forbidden-words list embedded.
- `lib/db/schema.ts` — Drizzle schemas for `briefs`, `packages`, `events`, `bookings`, `model_calls`. Indexes tuned for the heatmap and funnel queries.
- `lib/db/index.ts` — `postgres` driver instance, singleton across warm function instances, `max: 1`, `idle_timeout: 20`.
- `lib/db/cost.ts` — Sonnet pricing constants and `computeCost(in, out)` helper.
- `lib/format.ts` — `formatPriceEstimate`, `formatShape`, `stageLabel`, `formatStageOrder`.
- `lib/track.ts` — client-side `track(eventName, payload?)`. Uses `sendBeacon` first, falls back to `fetch keepalive`. No-ops server-side.
- `lib/cn.ts` — re-exports `cn` from `lib/utils.ts` (which is shadcn's standard `cn = (...) => twMerge(clsx(...))`).

---

## `components/`

- `components/encore/track-on-mount.tsx` — fires `track(event)` exactly once on mount. The only way server components can trigger a track call.
- `components/ui/button.tsx` — shadcn's primitive Button. Not used anywhere in customer pages or admin pages today; carried for future.

---

## Configuration

- `proxy.ts` (renamed from `middleware.ts` per Next 16 convention). Handles two things: issues `encore_sid` UUID cookie on customer routes; gates `/admin/*` and `/api/admin/*` behind Basic Auth checking `ADMIN_PASSWORD`. The matcher carefully excludes `/api/curate` and `/api/track` from auth so customer requests don't prompt for credentials.
- `eslint.config.mjs` — extends `eslint-config-next`. Disables `react-hooks/set-state-in-effect` for `app/**/*.tsx` because the legitimate sessionStorage→state pattern fires the rule.
- `next.config.ts` — empty.
- `drizzle.config.ts` — loads `.env.local` then `.env`, points at `lib/db/schema.ts`.
- `tsconfig.json` — strict, `types: ["node"]` workaround for a transitive type bug.

Environment variables expected (`.env.example`):

- `ANTHROPIC_API_KEY`
- `DATABASE_URL`
- `ADMIN_PASSWORD`

No others are read anywhere in the codebase.

---

## State flow (single user pass through the product)

1. User lands on `/`. Proxy sets `encore_sid` cookie if absent. `<TrackOnMount>` POSTs `landing.viewed` to `/api/track`.
2. User clicks "Plan the night". Routes to `/plan`. `track("plan.started")` fires.
3. User fills five steps. State held in five `useState` hooks. On submit:
   - `track("brief.submitted", { vibe, budget })`
   - `sessionStorage["encore.intake.v2"]` set to the `IntakeAnswers` JSON
   - `sessionStorage["encore.packages.v2"]` cleared
   - Routes to `/results`
4. `/results` reads intake from sessionStorage, POSTs to `/api/curate`. The route:
   - Reads `encore_sid` from cookie
   - Calls Anthropic, hydrates packages, retries once on archetype collision
   - Returns `{ packages }`
   - Via `waitUntil`: inserts 1 row to `briefs`, 3 rows to `packages` (with `position` 0/1/2), 1 or 2 rows to `model_calls`
5. `/results` writes the packages to sessionStorage and renders three cards.
6. User clicks a card. Routes to `/package/[id]` where `[id]` is the archetype id (also the package id). The page reads packages from sessionStorage, finds by id, fires `track("package.selected", { archetypeId })`. The `/api/track` side effect also flips `packages.selected_at` for that row.
7. User clicks "Book this evening". Routes to `/confirm?packageId=...`. The page fires `track("booking.confirmed")` and POSTs to `/api/bookings`, which inserts a `bookings` row.

**Where the package data lives at each step:** sessionStorage on the client; Postgres on the server (as a `packages.payload` jsonb column on each of the three rows). The client and server copies are independent; the client's is the source of truth for what the user sees.

**Why this matters for v3 thinking:** the package details ARE persisted server-side (in `packages.payload`), even though the client interaction model relies on sessionStorage. Any "send this evening to her" or "remind me what I booked tomorrow" feature has a server-side data store to read from.

---

## Email / KV / auth — confirmation

- **Email:** absent in every form. No service integration. No email field in `IntakeAnswers`. No mailto handler. No outbound email of any kind ever happens.
- **SMS:** absent.
- **KV / Redis:** absent. Postgres is the only persistent store.
- **Auth:** Customer-facing has no auth. Cookie holds an anonymous UUID session id only. Admin is gated by single-password Basic Auth via `proxy.ts`. This matches the buildplan constraint.
- **Calendar invites:** absent. The confirm page text says "We'll text you a calendar invite" was changed in the v2 audit to "Everything you need is on the previous page. Read it once on the way over." — so the false promise is gone, but no actual calendar functionality exists.

---

## Topics raised by Rob, cross-referenced against codebase

For each topic Rob raised in the May 11 call: what he said, what the code supports today, what would need to change, and whether this is a genuine fork.

### Voice AI ("Bordy" / ElevenLabs)

What Rob said: "Hey, this is Bordy. Can I give you a hand?" Voice assistant that pops up when the user pauses mid-flow. Explicitly deferred: "we don't have to do that right now."

Code supports today: nothing. No audio handling, no ElevenLabs integration.

What would need to change: a substantial new layer (audio capture, TTS, intent routing, mid-flow interruption logic).

Fork status: **Not a fork right now.** Rob deferred. Revisit only when the rest of the product has more signal.

### Restaurant onboarding / OpenTable

What Rob said: "I got to go get those places now." He's planning iPad-based in-person sales calls.

Code supports today: nothing operator-facing. Venues are hard-coded in `lib/seed-data.ts`.

What would need to change: depends on the ambition. A partner-facing landing page would be a single static route. An operator portal would need auth, vendor accounts, OpenTable integration, status management.

Fork status: **Not in this round.** Rob is handling the sales motion himself. The product side is downstream.

### Stripe Connect / real payments

What Rob said: future. "TBD what those fees might look like."

Code supports today: the concierge fee is a static disclosure line ("A 7% concierge fee is included…"). No payment flow at all.

Fork status: **Not in this round.** Real payments are a separate buildout when Rob has signed merchants.

### Comparison-shopper concern (Amazon framing)

What Rob said: show "$750 if you book this yourself, $450 if you book it here."

Johnny's stance in the call: didn't commit. Pricing claims are hard to back up; the audience may see through it.

Code supports today: nothing. Each package shows a single price range.

Fork status: **Not a fork for Rob in this round.** Johnny's pushback is the right one. Revisit only if user research shows people are leaving the flow to shop directly.

### Reciprocity principle

What Rob said: "you've given them the whole date and what to say. Are they really going to go shop it around?"

Code supports today: the package detail page is already detail-rich (narrative, sequence, why-this-venue lines, transitions, conversation starters, dont-bring-up). The reciprocity bet is already cooked into the design.

Fork status: **Not a fork — already in.** Captured in the new `## Product philosophy` section of `CLAUDE.md`.

### Post-date follow-up (morning-after email, 1-week check-in, video reviews)

What Rob said: morning-after email "Johnny, hey, how was the boat ride?" plus video review prompt; 1-week follow-up "Are you seeing that gal again?"

Code supports today: zero outbound communication. No email service. **No email address is collected anywhere in the product.** The `IntakeAnswers` type has no contact field. The confirm page asks for nothing post-booking.

What would need to change to ship the in-scope version (itinerary email at booking + morning-after note):

- Add an email-capture point somewhere in the flow (intake, package detail, or confirm).
- Add an email service integration (Resend is the lightest lift).
- Add a job runner for the morning-after send (Vercel cron is the lightest lift; one cron job that polls `bookings` for confirmed-yesterday and sends).
- Add an `email_subscriptions` or similar table on `bookings` to capture the email address.
- Build the email templates in voice.

What is **deferred per Johnny's explicit framing in the call**: 1-week follow-up, video reviews.

Fork status: **YES.** Multiple real forks here. Where to ask for email, what the morning-after email says, what kind of review the link points to.

### Mobile experience

What Rob said: reading on the phone was hard. Johnny said it was fixed.

Code supports today: the recent a11y pass bumped text sizes across the board (`text-xs` body content → `text-sm` or `text-base`, eyebrow caps from 12px → 13px, new darker `--brass-text` token for WCAG AA contrast, skip-link, `prefers-reduced-motion`). The customer-facing pages should now be comfortable to read at 375px.

Fork status: **Not a fork — already done.** But the principle stands: every future change needs a 375px audit before ship. Captured in the new `## Mobile-first reminder` section of `CLAUDE.md`.

### Audience reflection

What Rob said: 50+ primary, 30s/40s secondary. Men's Health framing.

Code supports today: voice and visual identity are already locked on the primary. The secondary audience is implicit, not addressed.

Fork status: **Not a fork — just synthesis.** Captured in the new `## Audience` section of `CLAUDE.md`.

### In-person demo capability (iPad walkthrough)

What Rob said: "I want to try to sit in front of as many people as I can, even if it's just with my phone, and show them and kind of get the visceral reaction."

Code supports today: the only entry path is `/` → `/plan` → fill brief → wait ~8 seconds → see results. To show someone the magic moment (the package detail page), Rob has to either walk them through the intake or pre-bake a brief on his iPad before the meeting.

What would need to change: an on-demand "Show me what one looks like" path that skips the intake and loads a pre-baked package directly into the detail view.

Fork status: **YES.** Real fork — multiple ways to implement, choice affects Rob's primary use case.

### Sharing a planned evening (with the date, or with a friend)

What Rob said: not explicitly raised in this call. The v3 prompt mentions it as an illustrative example.

Code supports today: nothing. Packages are sessionStorage-only on the client. The server has the `packages.payload` jsonb, but no public read route.

What would need to change: a public read route keyed by an opaque package id, a "Send to her" button on the detail page.

Fork status: **Not a fork for this round.** Rob didn't raise it. Filter out and revisit if testing shows people screenshotting or asking how to share.

### Marketing / contests / referrals / vendor credits

What Rob said: future.

Code supports today: nothing.

Fork status: **Not in this round.** Captured in `## Strategic non-goals` of `CLAUDE.md`.

### Conversational chatbot replacing the intake form

What Rob said: maybe. Johnny pushed back. Both agreed "later."

Code supports today: nothing.

Fork status: **Not a fork.** Deferred.

### Photos / embedded media / vendor logos

What Rob said: not raised. v2 buildplan explicitly says "no images."

Code supports today: type and color carry the design. No images anywhere.

Fork status: **Not a fork.** Stay disciplined.

### User accounts / auth

What Rob said: nothing.

Code supports today: anonymous session cookie only. No accounts. (Admin Basic Auth is for operators, not users.)

Fork status: **Not a fork.** Stay anonymous. Adding accounts is a major architectural shift only justified when product-market fit is proven.

---

## Architectural forks surfaced

After the cross-reference, three forks deserve Rob's input. Each one is a decision where two or three credible paths exist, the implementation choice shapes what Rob or users experience, and Rob can answer without engineering vocabulary.

1. **Email collection point.** Where in the flow do we ask for the man's email so we can send the morning-after note? The brief? The package detail page? The confirm screen?

2. **Morning-after email content.** What does the morning-after email actually say and do? A short check-in only? A check-in plus the itinerary recap? A link to a review prompt?

3. **In-person demo mode.** How does Rob show Encore to someone on his iPad without making them fill out the brief in front of him?

Three is the right number. The other topics Rob raised either have one obvious implementation (mobile already done), are strategic-non-goals (voice AI, real payments, contests), or are downstream of Rob's own sales motion (restaurant onboarding).

---

## Inconsistencies between buildplans and current code

A handful, worth knowing:

- **`CLAUDE.md` "Stack (locked)" still says Next.js 15.** The codebase is on Next 16.2.5. The `middleware.ts` → `proxy.ts` rename happened during the v2 ship. The stack section in `CLAUDE.md` predates this. The new sections being added in this v3 pass do not contradict it; the stack version specifically is the only stale line.
- **`CLAUDE.md` "What not to do" says "Do not add a database."** v2 added Drizzle + Railway Postgres for telemetry. This was an intentional deviation justified by the admin dashboard. The constraint should probably read "Do not add a database for user-facing state. State stays in React, URL params, or sessionStorage. Telemetry is OK on Postgres because it's read-only for operators."
- **`CLAUDE.md` "Code conventions" specifies routes as `/`, `/plan`, `/results`, `/package/[id]`, `/confirm`.** The admin routes were added later. The convention statement is now incomplete but not incorrect — admin is a separate concern.
- **`CLAUDE.md` "LLM integration" says model `claude-sonnet-4-5`.** Actual model in use is `claude-sonnet-4-6`, verified in the SDK type definitions during the v2 ship.
- **`FOLLOWUPS.md` lists "Mobile not opened in a real device emulator" as open.** Subsequent mobile testing + a11y pass addressed this. The follow-up entry is stale.
- **`FOLLOWUPS.md` has a duplicate `## "The Off-Hours" name` section and a duplicate `## Retry corrective message could be smarter` section.** Mechanical clean-up; not architectural.

None of these inconsistencies block the v3 phase. They will get cleaned up during the next implementation pass, not now.

---

## Notes carried forward to `CLAUDE.md`

The new sections that landed in `CLAUDE.md`:

- `## Audience` — primary 50+ men in West Palm; secondary busy 30s/40s professionals.
- `## Product philosophy` — reciprocity principle; voice carries weight that visual flourish would carry elsewhere.
- `## Use cases` — Rob's in-person demos; self-serve beta; future viral self-serve.
- `## Strategic non-goals` — voice AI, real Stripe Connect, referral credits, contests, video testimonials, vendor self-serve portal, conversational chatbot replacement, 1-week follow-up emails, photos, user accounts.
- `## Mobile-first reminder` — 375px audit required before every user-facing change.
- `## Voice on outbound communications` — same voice rules apply to email; subject lines read like a note from a friend.
- `## Active roadmap` — conditional ordering, pending Rob's answers in `QUESTIONS-FOR-ROB.md`.
