# Encore

> A curated date concierge for older men in West Palm Beach. The user describes a date, gets three options (**The Classic**, **The Off-Note**, **The Big Swing**), picks one, and mock-confirms an evening built around a real West Palm restaurant and an optional add-on.

This is the demo MVP. One stakeholder will walk through it end-to-end. Quality bar is high; surface area is intentionally narrow.

**Live:** https://encore-mocha-ten.vercel.app
**Repo:** https://github.com/jdpalumbo2/encore
**Stakeholder doc (binding):** [`CLAUDE.md`](./CLAUDE.md)
**Build phases:** [`Buildplan.md`](./Buildplan.md)
**Open follow-ups:** [`FOLLOWUPS.md`](./FOLLOWUPS.md)

---

## Table of contents

- [What this is](#what-this-is)
- [What this is not](#what-this-is-not)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Quickstart](#quickstart)
- [The user flow](#the-user-flow)
- [Data model](#data-model)
- [Curation engine](#curation-engine)
- [Voice and visual identity](#voice-and-visual-identity)
- [Styling system](#styling-system)
- [Build, types, lint](#build-types-lint)
- [Deploy pipeline](#deploy-pipeline)
- [Extending the system safely](#extending-the-system-safely)
- [Decision log](#decision-log)
- [Glossary](#glossary)

---

## What this is

A web app that translates a short, free-form brief about a date (who she is, when, what kind of night, budget, anything to avoid) into three plausible, well-written, end-to-end evenings in West Palm Beach. Each evening is built around a real restaurant pulled from a hand-curated seed list, optionally paired with a real second-half experience (sunset sail, museum, walk, daytime cruise), and presented with the room, the dress code, the parking, two specific conversation starters tuned to her, and one thing not to bring up.

The product is positioned to feel like a friend's recommendation, not an AI tool. The voice is the hardest part. See [`CLAUDE.md`](./CLAUDE.md) — the section labeled "Voice" is binding.

## What this is not

These are explicit non-goals from `CLAUDE.md` and they should not be added without a separate decision.

- **No database.** State lives in React + `sessionStorage`.
- **No real Stripe / payments.** The booking confirmation page is a mock.
- **No auth.** No accounts, no login.
- **No analytics, cookie banners, GDPR notices, marketing pages.**
- **No contact form, newsletter, social links, About page.**
- **No dark mode.**
- **No invented restaurants.** The model may only recommend from `lib/seed-data.ts`.

If you find yourself adding scope, stop. Note it in `FOLLOWUPS.md` and wait for direction.

---

## Tech stack

| Layer | Choice | Version | Role |
|---|---|---|---|
| Runtime | Node.js | 18+ (used 23.3.0 to build) | Server-side for API routes, build tooling |
| Framework | Next.js | 16.2.5 (App Router, Turbopack) | Routing, SSR, file-system routes, API routes, fonts |
| UI runtime | React | 19.2.4 | Component model, server / client component split |
| Language | TypeScript | ^5, `strict: true` | Whole codebase |
| Styling | Tailwind CSS | v4 (`@tailwindcss/postcss`) | Utility classes, `@theme` block in `app/globals.css` |
| Component primitives | shadcn (`base-nova` style) | 4.7.0 | Initial setup, `cn` helper, Button primitive (unused so far) |
| Primitive lib (under shadcn) | `@base-ui/react` | ^1.4.1 | Headless components shadcn defers to |
| Utility | `clsx` + `tailwind-merge` | 2.1.1 / 3.5.0 | The `cn` helper (`lib/utils.ts`, re-exported via `lib/cn.ts`) |
| Variant API | `class-variance-authority` | ^0.7.1 | Bundled with shadcn Button; not used outside `components/ui/` |
| Icons | `lucide-react` | ^1.14.0 | Available; not currently used in any page |
| LLM | `@anthropic-ai/sdk` | ^0.95.0 | Server-side Anthropic client in `app/api/curate/route.ts` |
| Model | `claude-sonnet-4-6` | Anthropic, current Sonnet | Hard-coded in `app/api/curate/route.ts` (`MODEL` const). Verify against the SDK's `Model` type before changing. |
| Animation utilities | `tw-animate-css` | ^1.4.0 | Pulled in by `shadcn init`. Used via the default class set; not heavily exercised. |
| Linter | ESLint | ^9, `eslint-config-next` 16.2.5 | One project-specific override (see [Build, types, lint](#build-types-lint)) |
| Hosting | Vercel | — | Production: `encore-mocha-ten.vercel.app`. GitHub repo is auto-linked. |
| Fonts | Google Fonts via `next/font/google` | — | Cormorant Garamond (display) + Inter (body), self-hosted by Next |

Every dependency has a reason. If you're tempted to add a new one (date pickers, form libraries, animation libs, headless component kits), check the rationale in `CLAUDE.md` first — most of them have been considered and ruled out.

---

## Repository layout

Annotated tree; everything not in this list is generated or boilerplate.

```
encore/
├── app/                          # Next.js App Router. Folder = route.
│   ├── globals.css               # Tailwind v4 @theme block + brand tokens. The single source of CSS.
│   ├── layout.tsx                # Root layout: <html>, <body>, header (wordmark), footer, font wiring, root metadata.
│   ├── page.tsx                  # "/"  Landing page (server component).
│   ├── plan/
│   │   ├── layout.tsx            # Per-route metadata only.
│   │   └── page.tsx              # "/plan"  Five-step intake (client component, useState/useTransition).
│   ├── results/
│   │   ├── layout.tsx
│   │   └── page.tsx              # "/results" Reads brief from sessionStorage, calls /api/curate, renders three cards.
│   ├── package/
│   │   └── [id]/
│   │       ├── layout.tsx
│   │       └── page.tsx          # "/package/:id" Full evening detail. Empty/notfound states.
│   ├── confirm/
│   │   ├── layout.tsx
│   │   └── page.tsx              # "/confirm" Mock confirmation. Suspense-wrapped (uses useSearchParams).
│   ├── api/
│   │   └── curate/
│   │       └── route.ts          # POST /api/curate  -> Anthropic, hydrate, return { packages: Package[] }.
│   └── (no other routes)
│
├── components/
│   ├── ui/                       # shadcn primitives. Only button.tsx exists; not used in any page yet.
│   └── encore/                   # Empty; reserved for Encore-specific composites if the system grows.
│
├── lib/
│   ├── types.ts                  # All shared types: Restaurant, Experience, Package, IntakeAnswers, PriceTier, VibeTag.
│   ├── seed-data.ts              # The 12 restaurants and 4 experiences. Source of truth for the model.
│   ├── encore-prompt.ts          # buildSystemPrompt() and buildUserPrompt() for the Anthropic call.
│   ├── cn.ts                     # Re-exports cn from utils.ts; satisfies the buildplan's "@/lib/cn" reference.
│   └── utils.ts                  # The actual cn = (...) => twMerge(clsx(...)) helper. shadcn writes here.
│
├── public/
│   ├── favicon.svg               # Brass "E" on navy. Hand-rolled inline SVG.
│   └── (next.svg, globe.svg, etc — leftovers from create-next-app, harmless)
│
├── CLAUDE.md                     # BINDING. Voice rules, palette, conventions, scope. Read first.
├── Buildplan.md                  # Phase-by-phase plan from empty repo to deployed Vercel demo.
├── SETUP.md                      # How a human runs the kickoff prompt.
├── AGENTS.md                     # One-liner: "this Next.js may differ from your training data, read node_modules/next/dist/docs/."
├── FOLLOWUPS.md                  # What's deliberately not done. Update when you defer something.
├── README.md                     # This file.
│
├── components.json               # shadcn config (style: base-nova, baseColor: neutral, cssVariables: true).
├── eslint.config.mjs             # Default Next config + one rule disable for app/**/*.tsx (see Build section).
├── next.config.ts                # Empty config. Keep it that way unless something specifically needs it.
├── postcss.config.mjs            # Tailwind v4 postcss plugin only.
├── tsconfig.json                 # strict: true, types: ["node"] (workaround), paths: @/* -> ./*
├── package.json                  # Locked dep set. Do not add deps without justification.
├── .env.example                  # ANTHROPIC_API_KEY=  (empty value)
└── .vercel/                      # Local Vercel link state (gitignored).
```

---

## Quickstart

```bash
# 1. Clone
git clone git@github.com:jdpalumbo2/encore.git
cd encore

# 2. Install
npm install

# 3. Point at an Anthropic key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

# 4. Run
npm run dev
```

Open http://localhost:3000.

The full flow you should be able to run end-to-end: `/` → "Plan the night" → fill in five steps → hit "See the three options" → wait ~5–10s → click any of the three → "Book this evening" → confirmation page.

If you don't have a key, the API route returns a structured error and `/results` shows a graceful "Try that again" state with a CTA back to `/plan`. The home, plan, package, and confirm pages still render correctly without a key.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next dev server with Turbopack on :3000. |
| `npm run build` | `next build`. Compiles, runs TypeScript check, generates static pages. |
| `npm run start` | Serve the production build. |
| `npm run lint` | ESLint (custom config in `eslint.config.mjs`). Should be clean. |

There are no tests. Don't add a test runner without a real reason; the demo is exercised manually.

---

## The user flow

A state machine. The arrows label the user actions; the boxes label the routes; the side notes label the side effects.

```
   [ / ]
     │ click "Plan the night"
     ▼
   [ /plan ]                           ── on submit, write sessionStorage["encore.intake"]
     │                                    and clear sessionStorage["encore.packages"]
     │ click "See the three options"
     ▼
   [ /results ]                        ── on mount, if "encore.packages" missing, POST
     │                                    /api/curate with the intake; on response, write
     │                                    "encore.packages"; render three cards.
     │ click a package card
     ▼
   [ /package/[id] ]                   ── on mount, read "encore.packages", find by id;
     │                                    update document.title to package title.
     │ click "Book this evening"
     ▼
   [ /confirm?packageId=… ]            ── on mount, read package + intake.when from
                                          sessionStorage; render mock confirmation.
```

### `sessionStorage` keys

| Key | Type | Set by | Read by |
|---|---|---|---|
| `encore.intake` | JSON-serialized `IntakeAnswers` | `/plan` on submit | `/results` (to fire the API), `/confirm` (for the `when` line) |
| `encore.packages` | JSON-serialized `Package[]` | `/results` after a successful API response | `/results` (cache hit), `/package/[id]`, `/confirm` |

Both are scoped to the browser tab. They go away on tab close.

### Direct deep-link behavior

Every page that depends on session state has a designed empty-state, not a silent redirect:

- `/results` with no intake → "We need a brief first." (CTA → `/plan`)
- `/package/[id]` with no packages → same missing-brief state
- `/package/[id]` with an unknown id → "That one isn't in the set." (CTAs back to `/results` or `/plan`)
- `/confirm` with no `packageId` query param or no matching package → "Nothing to confirm yet."

---

## Data model

`lib/types.ts` is the single source of truth.

```ts
type PriceTier = "$$" | "$$$" | "$$$$";

type VibeTag =
  | "classic" | "lively" | "intimate" | "waterfront"
  | "romantic" | "modern" | "old-world" | "sceney"
  | "quiet" | "jazz" | "coastal" | "foodie";

interface Restaurant {
  id: string;            // stable kebab-case id, used by the model
  name: string;
  neighborhood: string;
  cuisine: string;
  priceTier: PriceTier;
  vibe: VibeTag[];       // 3-5 tags
  blurb: string;         // one to two sentences in Encore's voice
  bestFor: string;       // a one-line scene-setter
  dressCode: string;     // logistics, in voice
  parking: string;       // logistics, in voice
  reservationNote?: string;
}

interface Experience {
  id: string;            // stable kebab-case id
  name: string;
  type: "cruise" | "museum" | "walk" | "gallery" | "cocktails" | "show";
  priceTier: PriceTier;
  vibe: VibeTag[];
  blurb: string;
  bestFor: string;
  duration: string;      // free-form, e.g. "60 to 90 minutes"
  pairsWellWith: string; // describes when in the night (used to label the section heading)
  logistics: string;
}

interface Package {
  id: string;            // exactly one of "classic" | "off-note" | "big-swing"
  title: string;         // "The Classic" | "The Off-Note" | "The Big Swing"
  headline: string;      // one sentence positioning
  restaurant: Restaurant;          // hydrated from id
  experience?: Experience;         // hydrated from optional id
  narrative: string;               // 3-5 sentences
  dressCode: string;
  parking: string;
  conversationStarters: string[];  // exactly 2 items
  dontBringUp: string;             // exactly 1 item
  priceEstimate: string;           // e.g. "$220 to $280 per person"
}

interface IntakeAnswers {
  herDescription: string;
  when: string;
  vibe: "relaxed" | "special" | "adventurous" | "classic";
  budget: "comfortable" | "elevated" | "no-ceiling";
  avoid?: string;
}
```

### Hydration

The Anthropic tool schema constrains `restaurantId` and `experienceId` to enums of seed ids. The model returns ids only. The route code (`app/api/curate/route.ts`, lines 158–186) maps ids back into the full `Restaurant` / `Experience` objects before sending the response to the client. This means:

1. The model cannot invent a venue. The schema enums prevent it at the tool-call layer.
2. The client always gets fully populated nested objects. UI code does not need to know about ids.
3. If you change the seed list (rename an id, remove a venue), the schema enums update on the next request automatically — they're computed at request time from `restaurants.map((r) => r.id)`.

### IDs and titles

Package IDs are deliberately fixed: `"classic"`, `"off-note"`, `"big-swing"`. The titles in the UI are `"The Classic"`, `"The Off-Note"`, `"The Big Swing"`. Don't change either without changing both — the package detail route is `/package/[id]` and the URL needs to be a slug.

---

## Curation engine

The single most important part of this codebase. Everything else is the wrapper.

### Files

- `lib/encore-prompt.ts` — `buildSystemPrompt(restaurants, experiences)` and `buildUserPrompt(answers)`. Pure functions, no side effects.
- `app/api/curate/route.ts` — the POST handler. Validates input, calls Anthropic, hydrates the response.
- `lib/seed-data.ts` — the venues. Inlined into the system prompt at request time.

### Request shape

```ts
POST /api/curate
Content-Type: application/json

{
  "herDescription": "She's mid-50s, plays tennis, just got back from Aspen.",
  "when": "Saturday night",
  "vibe": "relaxed",                    // one of the 4 enum values
  "budget": "comfortable",              // one of the 3 enum values
  "avoid": "No oysters."                // optional
}
```

### Response shape (success)

```json
{
  "packages": [Package, Package, Package]
}
```

Always exactly three. The order is: The Classic, The Off-Note, The Big Swing.

### Response shape (errors)

```json
{ "error": "Human-readable, in Encore's voice." }
```

Status codes used:

| Status | When | Message style |
|---|---|---|
| 400 | Missing required fields, oversized free-text | "The brief is missing a few details." / "The brief is too long. Trim it back." |
| 429 | Anthropic rate limit | "The service is busy. Try again in a moment." |
| 500 | Missing `ANTHROPIC_API_KEY`, or the API rejected the key | "The curation service isn't configured." / "The curation service rejected its key." |
| 502 | Upstream error, malformed tool call, missing tool call, unknown id in the response | "The curation service didn't respond. Try again." / "The response came back malformed." / `Unknown restaurant: <id>` |

The `/results` page surfaces the `error` field directly to the user. Be careful what you put in error messages: they're user-facing.

### Why tool use, not raw JSON

Anthropic's tool-use forces the model to fill a JSON schema. This gives us:

- **Type safety on output.** No regex over markdown, no JSON parsing errors.
- **Enum-constrained ids.** `restaurantId` and `experienceId` enums are computed from the seed list. The model cannot output a venue that doesn't exist.
- **Cardinality guarantees.** `minItems: 3, maxItems: 3` on the package array. `minItems: 2, maxItems: 2` on conversation starters.
- **No streaming complexity.** Tool responses arrive whole. We don't need to parse partial JSON. The buildplan suggested streaming if it improves perceived speed; for ~5–10s responses, the loading state on `/results` works fine.

The route forces the tool call with `tool_choice: { type: "tool", name: "present_packages" }`. The model has no other option.

### System prompt anatomy

`buildSystemPrompt(restaurants, experiences)` produces a single prompt with these sections (in order):

1. **Identity.** "You are Encore, a date concierge for older men in West Palm Beach."
2. **Voice.** Savvy older friend, dry, specific, never a chatbot. New Yorker columnist who got into the concierge business. Audience is 50+ men with money.
3. **Forbidden words.** Curated, tailored, personalized, elevated experience, crafted, handpicked, perhaps, maybe, em dashes, emoji, AI-startup register.
4. **Ground truth.** The seed `restaurants` and `experiences` arrays inlined as JSON. The model is told it may only reference these ids.
5. **Three-package contract.** Classic / Off-Note / Big Swing intentions. The Big Swing must include an `experienceId`.
6. **Budget mapping.** Comfortable → $$/$$$. Elevated → $$$/$$$$. No-ceiling → any tier, lean $$$$.
7. **Per-field guidance.** Narrative (3–5 sentences, with good/bad examples). Conversation starters (exactly 2, full sentences he'd say out loud, with good/bad examples). Don't-bring-up (1 item, with examples). Price estimate (use "to" between numbers, no hyphen or em dash). Headline (1 sentence, with examples).
8. **Output instruction.** Call `present_packages` exactly once, no other text.

The user message is the brief, formatted as a short text block.

### Why so many examples in the prompt

The conversation starters and narrative fields are **the magic moment** of the demo (per `SETUP.md`). Without good/bad examples, the model produces things like "Her travels: ask about Aspen." which read like coaching notes. With explicit examples ("What did you finish on the flight back?"), it produces sentences he'd actually say. The same pattern applies to narrative voice. If a future agent tunes the prompt and the magic-moment fields drift, the lever is to add or sharpen the examples.

### The hydration step

```ts
const restaurantById = new Map(restaurants.map((r) => [r.id, r]));
const experienceById = new Map(experiences.map((e) => [e.id, e]));

for (const r of raw) {
  const restaurant = restaurantById.get(r.restaurantId);
  if (!restaurant) return jsonError(502, `Unknown restaurant: ${r.restaurantId}`);
  // …assemble the Package with full restaurant + optional experience
}
```

If the model returns a known id but the seed list has been reduced and the id no longer exists, we surface a 502. This is intentional — silent fallback would mask a real schema drift.

### Length caps

`herDescription`, `avoid` ≤ 2000 characters each. `when` ≤ 200. Below the API call. Belt-and-suspenders against pasting an entire essay into the brief or against malformed clients.

### What you should NOT do here

- Don't hard-code package text. The whole point is the model fills in voice-tuned copy per brief.
- Don't relax the `tool_choice`. The non-tool path is unsafe (markdown, no schema).
- Don't make the seed list dynamic from a database. Inlined-as-prompt-context is the design — the model needs all venues visible.
- Don't add streaming unless `/results` perceived latency becomes a real complaint. The pulsing italic line is the loading state.

---

## Voice and visual identity

The voice is the most likely place this project goes off-brand. Treat `CLAUDE.md` "Voice" section as binding. A condensed reminder:

**Forbidden in user-facing copy:**
- Em dashes (use commas, periods, or parentheses)
- AI-startup language: "curated experiences," "tailored just for you," "powered by AI," "let me help you," "crafted," "handpicked"
- "I'm here to help," "happy to assist," any chatbot register
- Emoji
- More than one exclamation point per page
- Hedge words: "perhaps," "maybe," "could be," "might enjoy"

**Preferred:**
- Specifics over adjectives. "Two glasses of Sancerre and a quiet table on the side patio" beats "a romantic evening."
- Imperative CTAs. "Plan the night." not "Click here to plan your night."
- Light, dry, never cute. The audience is 50+ men with money. Treat them like adults.

When you write copy, the test is: *would this line appear in any AI-startup demo?* If yes, rewrite.

### Brand colors (locked)

These are the only colors. Defined as CSS variables in `app/globals.css` `:root`, then mapped to Tailwind utility names via the `@theme inline` block.

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `--background` | `#FAF7F2` | `bg-background` | Page background (warm off-white) |
| `--surface` | `#F0EBE3` | `bg-surface` | Card backgrounds (warm grey, optional) |
| `--primary` | `#1A2840` | `bg-primary`, `text-primary`, `text-navy` | Headlines, navy text |
| `--accent` | `#B8985A` | `bg-brass`, `text-brass`, `border-brass` | Brass accents, eyebrow text, CTA backgrounds |
| `--accent-hover` | `#A8884A` | `bg-brass-hover` | CTA hover state (one shade darker) |
| `--foreground` / `--text` | `#2C2C2C` | `text-text`, `text-foreground` | Body text (charcoal) |
| `--muted-foreground` / `--text-muted` | `#6B6760` | `text-text-muted`, `text-muted-foreground` | Secondary text (warm grey) |
| `--border` / `--hairline` | `#E5DFD5` | `border-hairline`, `border-border` | 1px hairline borders |
| `--destructive` | `#8C2A1F` | `text-destructive`, `bg-destructive` | Error states only |

Both spellings (`--text` / `--foreground`, `--hairline` / `--border`) work — they map to the same value. Use whichever reads better in context.

### Typography

- **Display:** Cormorant Garamond, weight 500. Class: `font-display font-medium`. Used for headlines, sectioned eyebrows, italic accents.
- **Body / UI:** Inter, weights 400 / 500 / 600. Class: `font-sans` (default). Used everywhere else.
- **Italic Cormorant** (`font-display italic`) is the workhorse for restaurant blurbs, conversation starters, and tasteful asides.

Both are loaded via `next/font/google` in `app/layout.tsx` with `display: "swap"`. The CSS variables `--font-inter` and `--font-cormorant` are exposed by Next, then aliased to `--font-sans` and `--font-display` in the `@theme inline` block. Tailwind's `font-sans` and `font-display` utilities resolve through this chain.

### Layout principles

- Generous whitespace. The product should feel like the lobby of a good hotel, not an app.
- Hairline borders (1px in `--hairline`) instead of drop shadows.
- No gradients. No shadows except subtle `shadow-sm` on hover (currently no shadows are used at all; hover state is a border color change).
- Max content width: 720px for prose, 1100px for layouts with cards.
- 8px-ish spacing scale. Stick to Tailwind's defaults (`p-6`, `mt-12`, `gap-6`).

---

## Styling system

### Tailwind v4 + `@theme inline`

This project uses Tailwind v4 (no `tailwind.config.ts`). Theme tokens live entirely in `app/globals.css`:

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-brass: var(--accent);
  --color-brass-hover: var(--accent-hover);
  --color-navy: var(--primary);
  /* …all shadcn tokens too: --color-primary, --color-muted, --color-border, etc. */

  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-cormorant), Georgia, "Times New Roman", serif;

  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 6px;
  --radius-xl: 8px;
}

:root {
  --background: #FAF7F2;
  --primary: #1A2840;
  --accent: #B8985A;
  --accent-hover: #A8884A;
  /* …etc */
  --radius: 4px;
}
```

The `@theme inline` block is what generates Tailwind utility classes. Adding `--color-foo: <something>` here makes `bg-foo`, `text-foo`, `border-foo` available everywhere.

**Why CSS variables on top of `@theme inline`?** Two layers of indirection lets us:
1. Keep the **palette values** in one place (`:root`).
2. Map them to **multiple semantic names** (`--color-text`, `--color-foreground` both point at `--foreground`).
3. Allow shadcn primitives to keep working with their expected token names without us renaming them.

### shadcn integration

shadcn was initialized with `--defaults --base-color neutral`. It produced:

- `components.json` (config)
- `components/ui/button.tsx` (a primitive currently NOT used in any page; we hand-rolled the CTAs because their look is so brand-specific)
- `lib/utils.ts` (the `cn` helper)
- A bunch of `--color-*` tokens in `globals.css` that the Button references

We then **overwrote** `globals.css` to map shadcn's expected tokens onto the Encore palette. So if you `import { Button } from "@/components/ui/button"` and use it, the default variant renders as navy (`bg-primary`) on warm off-white (`text-primary-foreground`) — on-brand without further work.

The buildplan asked for `lib/cn.ts`. shadcn made `lib/utils.ts`. Both exist; `lib/cn.ts` re-exports from `lib/utils.ts`. The shadcn Button imports `from "@/lib/utils"`. Page components import `from "@/lib/cn"`. Either is fine.

### Why so much inline Tailwind?

`CLAUDE.md` says: *"Tailwind classes inline. No CSS modules. Only `app/globals.css` for resets and font setup."* That's the convention. Don't pull classes into a `styles.ts` file or component variants unless something is truly reused with parametric styling — and in that case, prefer `class-variance-authority` (already installed by shadcn) over a custom abstraction.

### Focus rings

Global focus-visible outline (2px brass, 2px offset) is applied to all focusable elements in `app/globals.css`:

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

This is intentionally a one-rule sledgehammer instead of per-component focus styling. Brass on warm-off-white reads cleanly and is consistent across buttons, links, inputs, and the radio-style cards on `/plan`.

---

## Build, types, lint

### TypeScript

`tsconfig.json` has `"strict": true`. The whole codebase typechecks clean. If you add `any`, comment why.

There's one workaround in there:

```json
"types": ["node"]
```

This restricts which `@types/*` packages get auto-included. Without it, a transitive type reference to `@types/hapi__shot` (which doesn't exist on disk) causes the TypeScript build to fail. The `"types": ["node"]` setting is a Node-23-on-recent-deps quirk; if it ever becomes a problem (e.g. you need React types beyond what `next` provides), expand the array rather than removing the setting.

### ESLint

`eslint.config.mjs` extends `eslint-config-next` (core-web-vitals + typescript). One project-specific override:

```js
{
  files: ["app/**/*.tsx"],
  rules: {
    "react-hooks/set-state-in-effect": "off",
  },
}
```

React 19 added a rule that flags synchronous `setState` inside `useEffect`. The intended target is the pattern where derived state should be a `useMemo` instead. But in this app, several pages legitimately need an effect to bridge `sessionStorage` (a browser-only side channel) into React state on mount. The rule is a false positive in that case.

If you're adding a new effect that genuinely uses synchronous setState for a non-bridge reason, refactor it to derived state instead — don't lean on the override as a habit.

### Build

```bash
npm run build
```

Runs Turbopack to compile, then runs the TypeScript checker, then generates static pages. Output under `.next/`. The console summary lists routes; verify them after any routing change:

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/curate
├ ○ /confirm
├ ƒ /package/[id]
├ ○ /plan
└ ○ /results
```

`○` = static prerender, `ƒ` = dynamic (server-rendered or has dynamic segments). `/api/curate` and `/package/[id]` should always be dynamic; everything else should be static.

---

## Deploy pipeline

### Vercel

The project is linked to the Vercel project `jdpalumbo2s-projects/encore`. Linking happened via `vercel link --yes`, which also auto-connected the GitHub repo. As a result:

- **Pushes to `main`** automatically create production deployments on Vercel.
- **Manual production deploys** from the CLI work too: `vercel --prod --yes`.
- **Preview deploys** (any non-`main` branch push) create preview URLs.

### Environment variables

| Var | Required for | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | The curation engine | Server-side only. Set in Vercel for **both** Preview and Production. |
| `NEXT_PUBLIC_SITE_URL` | `metadataBase` (OG / canonical) | Optional. Falls back to `https://encore-mocha-ten.vercel.app` if unset. |

To set the API key:

```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY preview
# then redeploy or push to main
vercel --prod --yes
```

Or set both via the Vercel dashboard.

### Domain / aliases

- Production deploy URL changes per push (e.g. `encore-jg58dhwrp-jdpalumbo2s-projects.vercel.app`).
- Stable alias: `https://encore-mocha-ten.vercel.app`.
- Use the alias for sharing. Update `metadataBase` in `app/layout.tsx` if the project moves to a custom domain.

### Verifying a deploy

```bash
# Smoke test the landing page
curl -sI https://encore-mocha-ten.vercel.app | head -3
# Verify content
curl -s https://encore-mocha-ten.vercel.app | grep -oE "Plan a night[^<]*"
# Verify API graceful error path (when no key is set)
curl -s -X POST https://encore-mocha-ten.vercel.app/api/curate \
  -H "Content-Type: application/json" \
  -d '{"herDescription":"test","when":"Saturday","vibe":"relaxed","budget":"comfortable"}'
```

The expected error body when no key is set:

```json
{"error":"The curation service isn't configured. ANTHROPIC_API_KEY is missing."}
```

---

## Extending the system safely

If you're an agent picking this up, these are the most common changes and how to make them without breaking voice or scope.

### Add a restaurant

1. Append to the `restaurants` array in `lib/seed-data.ts`.
2. Pick a stable kebab-case `id`. Don't reuse one.
3. Pick 3–5 vibe tags from the existing `VibeTag` union. Don't introduce new tags casually.
4. Write `blurb` and `bestFor` in Encore's voice. Mirror the existing entries. **Test: read it out loud. If it sounds like a Yelp summary, rewrite.**
5. The model picks it up automatically on the next API call (the schema enums are computed at request time).

### Remove a restaurant

Just delete from the array. The model will not be able to refer to it by id. Clients holding cached `encore.packages` that include the removed venue will keep working (the data is hydrated and stored).

### Add a new vibe tag

1. Add the value to the `VibeTag` union in `lib/types.ts`.
2. Tag at least one restaurant with it (otherwise it's dead).
3. The model will see the new tag in the inlined seed JSON and may use it as part of its reasoning. No prompt change needed.

### Change the model

```ts
// app/api/curate/route.ts
const MODEL = "claude-sonnet-4-6";
```

Before changing: open `node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts` and verify the new id is in the `Model` union. The SDK pins what's valid. Don't invent ids.

### Swap to streaming

The current implementation uses non-streaming + tool use. To stream:

1. Use `client.messages.stream()` instead of `client.messages.create()`.
2. Iterate events; the `content_block_delta` events for tool inputs come as JSON-string deltas you have to accumulate.
3. The `/results` page would need to render incrementally or wait for `message_stop`.

Reasonable to do if the perceived latency is a complaint. Probably not worth it for a one-shot demo.

### Add a new section to the package detail

`/app/package/[id]/page.tsx` uses a `<Section label="…">` helper. Drop a new `<Section>` in the right position and render whatever from the `Package` shape:

```tsx
<Section label="One thing to skip tonight">
  <p className="font-sans text-text-muted">{pkg.dontBringUp}</p>
</Section>
```

If the new section needs new data, add a field to the `Package` interface in `lib/types.ts` AND to the tool schema in `app/api/curate/route.ts` AND to the system prompt's per-field guidance in `lib/encore-prompt.ts`. Three places, every time.

### Adjust the brand palette

CLAUDE.md locks the palette as it currently exists. Don't change values without a real reason. If you do:

1. Update the hex values in `:root` in `app/globals.css`.
2. The `@theme inline` block already references them via `var(--…)` — utility classes will pick the new values up automatically.
3. Verify the focus-ring contrast with the new palette (currently brass on warm-off-white).

### Tighten the voice rules

Add words to the **FORBIDDEN WORDS AND PHRASES** section of the system prompt in `lib/encore-prompt.ts`. Re-deploy. The model will avoid them on the next call.

If a forbidden phrase keeps showing up despite being on the list, escalate from "forbidden" to "if you produce X, the output is wrong" — explicit failure framings work better than warnings.

---

## Decision log

Why-this-not-that for the choices an agent might second-guess.

- **Next.js 16 (Turbopack), App Router.** The buildplan said Next 15. We got 16 because that's what `create-next-app@latest` returns as of build time. Turbopack is the default bundler. The `AGENTS.md` note flags that this version of Next has breaking changes from earlier; check `node_modules/next/dist/docs/` for current API shape.
- **React 19.** Comes with Next 16. Forces us into `Suspense` for `useSearchParams` (see `app/confirm/page.tsx`).
- **Tailwind v4, no `tailwind.config.ts`.** v4 uses `@theme` blocks in CSS instead of a JS config. shadcn supports this; we leaned in.
- **shadcn for primitives, hand-rolled CTAs.** shadcn's Button is on-brand-able but has a lot of class baggage. The CTAs (`bg-brass text-primary px-8 py-4 rounded-sm`) are short enough that hand-rolling is clearer than configuring a variant.
- **No streaming on `/api/curate`.** Tool-use returns the whole tool input as a single block. The `/results` loading state covers the latency.
- **`tool_choice` is forced.** Without forcing, the model occasionally writes prose alongside the tool call. With forcing, we always parse a clean tool block.
- **Enum-constrained ids in the schema.** The model literally cannot return an unknown venue. Belt-and-suspenders against hallucination.
- **Hydration server-side, not client-side.** The client gets full nested objects and never has to know about ids. If we move to a server-side store, this changes.
- **`sessionStorage`, not URL params or cookies.** URL params would expose the brief in shareable links; cookies require a banner in some jurisdictions; localStorage persists too long. SessionStorage is tab-scoped and disappears on close, which matches the demo's no-persistence stance.
- **Cormorant Garamond + Inter, both via `next/font/google`.** Self-hosted by Next, no external CDN at runtime. Letter-spacing and weight pinned in `app/layout.tsx` font config.
- **Brass focus ring everywhere.** One global rule beats per-element fiddling. Keyboard users get a consistent affordance.
- **`document.title` updated client-side on `/package/[id]`.** Because the page is a client component reading sessionStorage, server-side `generateMetadata` can't access the package. Updating the title in the load effect is the workaround. If/when packages move to a server-side store, switch to `generateMetadata`.
- **Length caps on free-text inputs.** 2000 chars on `herDescription` and `avoid`, 200 on `when`. Defends against pasting essays into the brief and keeps prompt-injection windows narrow.
- **`react-hooks/set-state-in-effect` disabled for `app/**/*.tsx`.** The legitimate sessionStorage→state pattern triggers it. Documented in FOLLOWUPS.md.
- **No tests.** Demo. Manual exercise on the deployed URL is the verification. If this becomes a real product, integration tests around `/api/curate` (hitting Anthropic with a recorded brief) are the highest-value first step.

---

## Glossary

Internal terminology used in code and prompts.

- **Brief** — the bundle of intake answers. `IntakeAnswers` in code. The user submits a brief; the model produces packages from it.
- **Package** — one of the three options the user picks from. Identified by `"classic"`, `"off-note"`, or `"big-swing"`.
- **The Classic** — safe, beautiful, well-trodden. Cannot go wrong.
- **The Off-Note** — slightly unexpected. The friend's personal recommendation.
- **The Big Swing** — splashier, higher-ticket, must include a second-half experience.
- **Narrative** — the 3–5 sentence arc-of-the-evening paragraph. Lives on `Package.narrative`.
- **Conversation starter** — a complete sentence or question he could say out loud to her, calibrated to her description. Two per package.
- **Don't bring up** — one tasteful skip per package. Subtle aside, never preachy.
- **Hydration** — the server-side step in `/api/curate` that turns model-returned ids into full `Restaurant`/`Experience` objects nested in each `Package`.
- **Wordmark** — the "Encore" text-only logo in the header. Cormorant Garamond, weight 500, with `tracking-[0.06em]`.
- **Hairline** — the 1px `#E5DFD5` border used for cards and dividers. Replaces drop shadows in this design system.
- **Specimens** — the three small example evening cards on the landing page. Static; demonstrate what the product produces without an LLM round-trip.

---

## Where things live, one more time

If you forget exactly where something lives, this is the cheat sheet.

- **Add a restaurant or experience:** `lib/seed-data.ts`
- **Change a type:** `lib/types.ts`
- **Tune the model's voice or rules:** `lib/encore-prompt.ts`
- **Change the API request/response shape:** `app/api/curate/route.ts` (and types, and prompt)
- **Edit landing copy:** `app/page.tsx`
- **Edit intake questions:** `app/plan/page.tsx`
- **Edit the results card layout:** `app/results/page.tsx`
- **Edit the full evening view:** `app/package/[id]/page.tsx`
- **Edit the mock booking page:** `app/confirm/page.tsx`
- **Add a brand color, font, or radius token:** `app/globals.css`
- **Change the wordmark or footer:** `app/layout.tsx`
- **Override a lint rule:** `eslint.config.mjs`
- **Tweak metadata / titles per route:** `app/<route>/layout.tsx`

For anything else, search starts at `CLAUDE.md` (binding rules) and `Buildplan.md` (build phases). If a question has no answer in either, that is itself useful information — note it in `FOLLOWUPS.md` and ask.
