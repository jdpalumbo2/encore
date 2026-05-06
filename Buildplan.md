# Buildplan.md

Build Encore from empty repo to deployed Vercel demo. Phases run sequentially. Auto-continue between phases. Commit at each boundary.

---

## Phase 0: Scaffold

Create the project, install dependencies, set up the design system foundation.

**Steps:**

1. `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"` (run from inside the repo directory; do not nest a project folder)
2. Install: `@anthropic-ai/sdk clsx tailwind-merge class-variance-authority lucide-react`
3. Initialize shadcn: `npx shadcn@latest init` with neutral base color, CSS variables yes
4. Add Cormorant Garamond and Inter via `next/font/google` in `app/layout.tsx`
5. Configure brand colors in `app/globals.css` as CSS variables AND in `tailwind.config.ts` (or `@theme` block in v4) so they're addressable as `bg-background`, `text-primary`, `border-hairline`, etc.
6. Create `.env.example` with `ANTHROPIC_API_KEY=`
7. Create folder structure:
   ```
   /app
     /api/curate
     /plan
     /results
     /package/[id]
     /confirm
   /components
     /ui          (shadcn primitives)
     /encore      (Encore-specific composites)
   /lib
     seed-data.ts
     encore-prompt.ts
     types.ts
     cn.ts
   ```
8. Add a `cn` helper in `/lib/cn.ts`
9. Strip the default `app/page.tsx` boilerplate. Leave a placeholder.

**Acceptance:** `npm run dev` boots without errors. Brand colors are accessible via Tailwind. Fonts load on the placeholder page.

**Commit:** `phase 0: scaffold and design tokens`

---

## Phase 1: Types and seed data

Define the data model and seed the West Palm establishments.

**Steps:**

1. In `/lib/types.ts`, define:
   ```ts
   type PriceTier = '$$' | '$$$' | '$$$$';
   type VibeTag = 'classic' | 'lively' | 'intimate' | 'waterfront' | 'romantic' | 'modern' | 'old-world' | 'sceney' | 'quiet' | 'jazz' | 'coastal' | 'foodie';

   interface Restaurant {
     id: string;
     name: string;
     neighborhood: string;
     cuisine: string;
     priceTier: PriceTier;
     vibe: VibeTag[];
     blurb: string;            // 1-2 sentences, in Encore's voice
     bestFor: string;          // e.g., "First dinners. Confident, conversational, won't try too hard."
     dressCode: string;        // e.g., "Smart casual. Jacket optional, never required."
     parking: string;          // logistics line
     reservationNote?: string; // e.g., "Notoriously hard to get into. Wednesdays softer."
   }

   interface Experience {
     id: string;
     name: string;
     type: 'cruise' | 'museum' | 'walk' | 'gallery' | 'cocktails' | 'show';
     priceTier: PriceTier;
     vibe: VibeTag[];
     blurb: string;
     bestFor: string;
     duration: string;
     pairsWellWith: string;    // e.g., "Before dinner" or "After a Worth Avenue dinner"
     logistics: string;
   }

   interface Package {
     id: string;
     title: string;            // e.g., "The Classic", "The Off-Note", "The Big Swing"
     headline: string;         // 1 sentence positioning
     restaurant: Restaurant;
     experience?: Experience;  // optional add-on
     narrative: string;        // 3-5 sentences in Encore's voice describing the evening arc
     dressCode: string;
     parking: string;
     conversationStarters: string[];  // 2 items
     dontBringUp: string;      // 1 item, subtle
     priceEstimate: string;    // e.g., "$280-340 per person"
   }

   interface IntakeAnswers {
     herDescription: string;   // free text
     when: string;             // free text or date
     vibe: 'relaxed' | 'special' | 'adventurous' | 'classic';
     budget: 'comfortable' | 'elevated' | 'no-ceiling';
     avoid?: string;           // free text
   }
   ```

2. In `/lib/seed-data.ts`, populate the data using the seed list below. **Do not invent restaurants.** Use exactly these. Write the `blurb` and `bestFor` fields in Encore's voice (specific, dry, no AI cliches).

**Restaurants (use these names exactly):**

- **Buccan** (Palm Beach) — small plates, lively, James Beard nominated, hard to book, sceney
- **Estiatorio Milos** (West Palm Beach) — Greek seafood, Intracoastal views, white-tablecloth, $$$$
- **Maison Carlos** (West Palm Beach) — French/Italian, ~12 tables, owner seats you, intimate
- **Café Boulud** (Palm Beach, Brazilian Court Hotel) — French, Daniel Boulud, classic-elegant
- **Café L'Europe** (Palm Beach) — live jazz, candlelight, romantic, old-school
- **Sourbon** (West Palm Beach) — botanical room, hidden speakeasy upstairs, modern
- **Fern** (West Palm Beach) — farm-to-table, urban-art interior, modern, foodie
- **The Blind Monk** (West Palm Beach) — wine bar, charcuterie, beautiful patio, casual-elegant
- **Grato** (West Palm Beach) — Clay Conley's Italian, wood-fired, casually elegant
- **Okeechobee Steak House** (West Palm Beach, since 1947) — old-school steakhouse, classic
- **Pink Steak** (West Palm Beach) — modern steakhouse, Julien Gremaud, sceney
- **BiCE Ristorante** (Palm Beach) — Italian institution, classic-elegant

**Experiences (use these):**

- **Sunset Sail on the Motunui** (Visit Palm Beach) — luxury catamaran, 90-120 min, Intracoastal sunset
- **Mimosas, Mansions & Megayachts cruise** (Visit Palm Beach) — 90 min, daytime, Palm Beach waterfront mansions
- **Norton Museum of Art** (West Palm Beach) — evening hours Thursdays, sculpture garden, refined
- **Worth Avenue evening stroll** (Palm Beach) — gallery windows, espresso, no booking needed; logistics line should reflect that

3. Vibe-tag every entry thoughtfully. Don't over-tag. Three to five tags per entry max.

**Acceptance:** `seed-data.ts` exports two typed arrays. Every entry has all required fields. Voice consistent.

**Commit:** `phase 1: types and seed data`

---

## Phase 2: Brand layer and landing page

Build the home page. This is what Rob lands on first; it has to set the tone immediately.

**Steps:**

1. Set up a base layout in `app/layout.tsx`:
   - `<body>` uses `bg-background text-text` and the Inter font
   - A minimal header with the Encore wordmark (text only, Cormorant Garamond, weight 500, slight letter-spacing) on the left and nothing on the right. No nav. No login button.
   - A minimal footer with "Encore. West Palm Beach." in muted text. No links.

2. Build `app/page.tsx`:
   - Centered hero, max-width 720px, generous vertical padding
   - Headline (Cormorant, large, ~text-5xl): "Plan a night that says you've been paying attention."
   - Subhead (Inter, text-lg, muted): one line that explains what Encore does without saying "AI" or "concierge platform." Try something like: "You bring the date. Encore handles the rest of the evening."
   - One-line eyebrow above the headline in brass: "WEST PALM BEACH. BY INVITATION."
   - Primary CTA button: "Plan the night" → links to `/plan`. Brass background, navy text, no rounded corners or very subtle (4px), Cormorant or Inter weight 600.
   - Below the CTA, three small specimen cards in a row showing example evenings. Each card: small italic header ("A second date with someone who reads"), one line of evening description ("Maison Carlos, the corner table. Then a walk on Worth."). Hairline border. No images. Demonstrates what the product produces.

3. No images on the page in v0. Type and color do the work.

**Acceptance:** Landing page loads. Wordmark visible. CTA goes to `/plan`. Looks like a real product, not a Tailwind starter.

**Commit:** `phase 2: landing page`

---

## Phase 3: Intake flow

Multi-step form that collects intake answers. Guided, one question at a time, with subtle chat framing.

**Steps:**

1. `app/plan/page.tsx` is a client component holding a `useReducer` or `useState` for the multi-step form
2. Five steps, one question per screen, with progress indicator (subtle, e.g., "1 of 5" in muted text top-left, no bar)
3. Each step has a quiet conversational lead-in line above the input. Examples (use these or improve them):
   - Step 1: "Tell us about her." → free text input, placeholder: "She's mid-50s, plays tennis, just got back from Aspen..."
   - Step 2: "When?" → free text or simple date picker. Allow "tomorrow," "this weekend," or a date.
   - Step 3: "What kind of night?" → 4 cards: Relaxed dinner / Special occasion / Adventurous / Classic. Single select.
   - Step 4: "Budget comfort?" → 3 options: Comfortable ($150-250 pp), Elevated ($250-450 pp), No ceiling. Single select.
   - Step 5: "Anything to avoid?" → free text, optional. Placeholder: "Dietary stuff, mobility, things she doesn't want to talk about..."
4. Smooth transitions between steps (fade or slide, ~200ms, subtle)
5. "Back" link in muted text top-left after step 1
6. Final CTA on step 5: "Curate the evening" → POST to `/api/curate`, then navigate to `/results` with answers stored (URL-encode in query string OR `sessionStorage`; pick whichever is cleaner)
7. All inputs styled consistently: hairline border, generous padding, Cormorant for the question, Inter for the input

**Acceptance:** All five steps work. Back navigation works. Submit triggers loading state. Navigation to `/results` happens after successful POST.

**Commit:** `phase 3: intake flow`

---

## Phase 4: Curation engine

The heart of the demo. The Anthropic API call that turns intake answers into three packages.

**Steps:**

1. Build `/lib/encore-prompt.ts` exporting a function `buildSystemPrompt(seedRestaurants, seedExperiences)` that returns a system prompt. The prompt:
   - Establishes Encore's identity and voice (savvy older friend, dry, specific, never a chatbot)
   - Provides the full seed list inline as structured data
   - Instructs Claude to return exactly three packages with these labels and intents:
     - **The Classic**: safe, beautiful, well-trodden. Rob's friend can't go wrong.
     - **The Off-Note**: slightly unexpected. Memorable for the right reason.
     - **The Big Swing**: splashier, higher-ticket, includes an experience add-on.
   - Each package must reference a real restaurant from the seed list (by id) and optionally a real experience (by id)
   - The `narrative` field is 3-5 sentences in Encore's voice describing the evening arc
   - `conversationStarters` are TWO items, each calibrated to what the user said about her
   - `dontBringUp` is ONE item, subtle and kind, never preachy
   - `priceEstimate` is a per-person range
   - Forbidden words: "curated," "tailored," "personalized," "experience" (as marketing noun), em dashes
   - Output must be valid JSON matching the `Package[]` schema (length 3)

2. Build `/app/api/curate/route.ts`:
   - Accept POST with `IntakeAnswers`
   - Call Anthropic with the system prompt, model `claude-sonnet-4-5` (verify exact identifier in SDK docs at build time)
   - Use tool use to enforce JSON schema. Define a `present_packages` tool that takes the `Package[]` shape. Force Claude to use it.
   - Hydrate the returned packages by joining the `restaurantId` and `experienceId` references back to the full seed objects so the frontend gets complete `Restaurant` and `Experience` objects nested inside each `Package`
   - Return `{ packages: Package[] }` or a structured error
   - Handle rate-limit and API-key-missing cases with a clear error response

3. Build `/app/results/page.tsx`:
   - Read the answers from sessionStorage or query params
   - If no `packages` are passed in (e.g., user lands here directly), redirect to `/plan`
   - Otherwise display three package cards in a vertical stack on mobile, side-by-side on desktop
   - Each card: title (Cormorant, navy), headline (Inter italic, muted), restaurant name and neighborhood, optional experience pairing, vibe tags as small brass-bordered chips, price estimate, "See the evening" CTA → `/package/[id]`
   - Loading state: a single line of text in Cormorant italic ("Crafting three options...") with a subtle pulse animation. No spinner.
   - Error state: a quiet message offering to try again. No technical detail to the user.

**Acceptance:** Submitting the intake flow produces three real packages from the seed data. Loading state shows. Cards render cleanly. Clicking a card navigates to its detail page. If `ANTHROPIC_API_KEY` is missing, the error state is graceful.

**Commit:** `phase 4: curation engine and results`

---

## Phase 5: Package detail and mock booking

Click into a package, see the full evening, mock-confirm.

**Steps:**

1. `app/package/[id]/page.tsx`:
   - Read the package from sessionStorage (set when the API responds in Phase 4) or pass via state
   - Layout: hero with package title (Cormorant, large) and headline (Inter italic, muted)
   - Sections, in order:
     - **The evening** — narrative paragraph (Cormorant body, slightly larger than default)
     - **Where** — restaurant card (name, neighborhood, blurb in italic, why-it's-right line)
     - **And before/after** — experience card if present, otherwise omit
     - **What to wear** — single line, Inter, dress code text
     - **Getting there** — single line, parking notes
     - **Two things to ask her about** — two bullets in Cormorant italic, conversation starters
     - **One thing to skip tonight** — single line in muted text, the dontBringUp item
   - Bottom: large "Book this evening" CTA (brass) → `/confirm?packageId=...`
   - Secondary "See the other two" link → back to `/results`

2. `app/confirm/page.tsx`:
   - Mock confirmation. No real Stripe call. The page just reads the package from session and displays:
     - Cormorant header: "Your table is held."
     - Restaurant name, date/time as confirmed (use the user's "when" answer or "Tonight at 7:30" as default)
     - One line: "We'll text you a calendar invite and the night-of details."
     - A small italic Encore signoff line: "Have fun."
     - Secondary CTA: "Plan another evening" → `/`
   - No fake invoice, no charge UI, no Stripe logos.

**Acceptance:** Clicking a package card navigates to its detail page with all sections rendered. Booking CTA navigates to confirm page. Confirm page reads cleanly.

**Commit:** `phase 5: package detail and mock booking`

---

## Phase 6: Polish and deploy

Final pass for empty states, mobile, micro-typography. Deploy.

**Steps:**

1. Mobile pass: every page should look intentional on a 375px wide viewport. The intake form is the highest-risk surface; make sure inputs aren't cramped.
2. Empty/error states for `/results` and `/package/[id]` (e.g., if someone lands directly without going through `/plan`)
3. Micro-typography: smart quotes, en dashes for ranges, no widows in headlines on common viewport widths
4. Favicon: a simple brass dot or letter "E" in Cormorant on a navy background. Generate as SVG.
5. Set page titles and meta descriptions for each route. Tone matches the product (no SEO-spammy copy).
6. Add a `README.md` at the repo root with: project name, what it is in one paragraph, how to run locally, env var setup, deploy notes
7. Deploy to Vercel:
   - Push the repo to a new GitHub repo (or instruct the user to)
   - Use Vercel CLI: `vercel` to link, then `vercel --prod` to deploy
   - Set `ANTHROPIC_API_KEY` in the Vercel project environment variables
   - Confirm the deployed URL works end-to-end
8. Final manual walkthrough: land → plan → results → package → confirm. Make sure nothing breaks.

**Acceptance:** Live URL works. End-to-end flow runs. Mobile is clean. Stop here and report the URL plus any decisions made along the way.

**Commit:** `phase 6: polish and deploy`

---

## After phase 6: stop

Do not add features beyond phase 6. Note any rough edges or follow-ups in a `FOLLOWUPS.md` file but do not fix them. Wait for direction.
