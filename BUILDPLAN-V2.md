# BUILDPLAN-V2.md

Continuation of the Encore build. Phase 0-6 from `Buildplan.md` should already be deployed. This document covers Phase 7-10, which evolve the product from "AI picks a restaurant" to "AI designs an evening sequence" using a social-architecture framework.

`CLAUDE.md` is still authoritative for voice, visual identity, and what-not-to-do. Reread it before each phase.

---

## Why this version exists

The v1 product treats an evening as a restaurant with maybe one optional experience. That's too thin. A real evening is a sequence with pacing, transitions, and an emotional arc.

This version restructures the data model around three concepts:

- **Venue.** Unified type for any place (restaurants, bars, cafes, museums, parks, water, bookstores, etc.). Replaces the separate `Restaurant` and `Experience` types from v1.
- **Archetype.** A template for an evening's shape, defined by a sequence of stages, a signal it communicates, and the kind of date it's right for. Encore has eight of these.
- **Package.** Still the unit the user sees. But now a Package is an instantiation of an Archetype, with each stage filled by a real Venue.

The user-facing change: instead of three lightly differentiated dinner recommendations, the user sees three **structurally different** evenings (e.g., a cocktails-dinner-nightcap progression, a morning walking conversation, an activity-then-food sequence). The differentiation is obvious at a glance.

What's NOT changing: visual identity, voice, no-database / no-Stripe / no-auth constraints, the page count and routes, the MVP scope.

---

## Phase 7: Data model expansion and venue library

Restructure the data layer. Expand seed data.

**Steps:**

1. **Update `/lib/types.ts`.** Replace the `Restaurant` and `Experience` interfaces with a unified `Venue`, and add `Archetype`, `PackageStage`, and a new `Package` shape. Final types in this file:

   ```ts
   export type PriceTier = '$$' | '$$$' | '$$$$';

   export type VenueCategory =
     | 'restaurant'
     | 'bar'
     | 'cafe'
     | 'museum'
     | 'gallery'
     | 'garden'
     | 'walk'
     | 'water'
     | 'bookstore'
     | 'sport'
     | 'venue';

   export type VibeTag =
     | 'classic' | 'lively' | 'intimate' | 'waterfront' | 'romantic'
     | 'modern' | 'old-world' | 'sceney' | 'quiet' | 'jazz'
     | 'coastal' | 'foodie' | 'cultural' | 'outdoor' | 'active'
     | 'contemplative' | 'literary';

   export interface Venue {
     id: string;
     name: string;
     category: VenueCategory;
     neighborhood: string;
     priceTier: PriceTier;
     vibe: VibeTag[];
     blurb: string;            // 1-2 sentences in Encore voice
     bestFor: string;          // who and what this venue is right for
     dressCode?: string;
     parking?: string;
     reservationNote?: string;
     typicalDuration: string;  // e.g., "90 min", "2 hours", "as long as you like"
   }

   export type StageKind =
     | 'cocktails' | 'dinner' | 'nightcap' | 'coffee' | 'brunch'
     | 'walk' | 'cultural' | 'activity' | 'water' | 'browse' | 'show';

   export interface PackageStage {
     order: number;            // 1, 2, 3...
     kind: StageKind;
     venueId: string;          // resolved to full Venue server-side before sending to client
     venue: Venue;             // hydrated
     timeOfEvening: string;    // e.g., "5:30 pm", "right after dinner", "the next morning"
     why: string;              // 1 line: why this venue at this stage of this evening
     transition?: string;      // optional: 1 line about how to move to the next stage
   }

   export interface Archetype {
     id: string;
     name: string;             // e.g., "The Classic", "The Long Walk"
     description: string;      // 1 sentence describing the shape and feel
     shape: StageKind[];       // sequence of stage kinds, e.g., ['cocktails', 'dinner', 'nightcap']
     signal: string;           // what this evening communicates (taste / energy / curiosity / etc.)
     bestFor: string;          // the kind of date and person this fits
     intensity: 'low' | 'medium' | 'high';
     timeOfDay: 'morning' | 'daytime' | 'evening' | 'flexible';
   }

   export interface Package {
     id: string;
     archetypeId: string;
     archetypeName: string;        // denormalized for easy display
     headline: string;             // 1 sentence calibrated to this specific date
     signal: string;               // calibrated signal phrase, e.g., "Patience and taste"
     stages: PackageStage[];       // 2-4 stages
     narrative: string;            // 3-5 sentences in Encore voice describing the evening arc
     conversationStarters: string[];   // 2 items
     dontBringUp: string;          // 1 item
     priceEstimate: {
       low: number;
       high: number;
       perPerson: boolean;
       conciergeFeeNote: string;   // disclosure copy for the fee
     };
   }

   export interface IntakeAnswers {
     herDescription: string;
     when: string;
     vibe: 'relaxed' | 'special' | 'adventurous' | 'classic';
     budget: 'comfortable' | 'elevated' | 'no-ceiling';
     avoid?: string;
   }
   ```

2. **Replace `/lib/seed-data.ts`** entirely. Export a single `venues: Venue[]` array AND an `archetypes: Archetype[]` array. Use the lists below verbatim (write the `blurb` and `bestFor` fields in Encore voice). Also delete the old `restaurants` and `experiences` exports.

   **Venues to seed (~30, names exact):**

   *Restaurants (12):*
   - Buccan (Palm Beach) — small plates, lively, James Beard nominated, hard to book
   - Estiatorio Milos (West Palm Beach) — Greek seafood, Intracoastal views, white-tablecloth, $$$$
   - Maison Carlos (West Palm Beach) — French/Italian, ~12 tables, owner seats you, intimate
   - Café Boulud (Palm Beach, Brazilian Court Hotel) — French, Daniel Boulud, classic-elegant
   - Café L'Europe (Palm Beach) — live jazz, candlelight, romantic, old-world
   - Sourbon (West Palm Beach) — botanical room, modern
   - Fern (West Palm Beach) — farm-to-table, urban-art interior, modern foodie
   - Grato (West Palm Beach) — Clay Conley's Italian, wood-fired, casually elegant
   - Okeechobee Steak House (West Palm Beach, since 1947) — old-school steakhouse
   - Pink Steak (West Palm Beach) — modern steakhouse, Julien Gremaud, sceney
   - BiCE Ristorante (Palm Beach) — Italian institution, classic-elegant
   - Avocado Grill (West Palm Beach) — brunch and dinner, fresh, lively

   *Bars / Cocktails (4):*
   - HMF at The Breakers (Palm Beach) — hotel bar, sceney cocktails, classic
   - Honor Bar at Royal Poinciana Plaza (Palm Beach) — chic, polished, all-day
   - The Blind Monk (West Palm Beach) — wine bar, charcuterie, beautiful patio
   - The Speakeasy at Sourbon (West Palm Beach) — hidden upstairs at Sourbon, dim and quiet

   *Cafes (3):*
   - Subculture Coffee (West Palm Beach) — downtown, design-forward, daytime energy
   - Pumphouse Coffee Roasters (West Palm Beach) — local roaster, calm
   - Avocado Grill — already listed under restaurants but tag with brunch vibe; do not duplicate the entry

   *Cultural (3):*
   - Norton Museum of Art (West Palm Beach) — major museum, Thursday evening hours, sculpture garden
   - Society of the Four Arts (Palm Beach) — campus with gallery, library, gardens, lectures
   - Kravis Center for the Performing Arts (West Palm Beach) — concerts, theater, dance

   *Gardens / Walks (4):*
   - Mounts Botanical Garden (West Palm Beach) — 14 acres, contemplative, daytime
   - Pan's Garden at Preservation Foundation (Palm Beach) — small, native plants, peaceful
   - Worth Avenue (Palm Beach) — gallery windows, espresso stops, no booking, day or evening
   - Flagler Drive waterfront (West Palm Beach) — long Intracoastal walk, sunset

   *Water (2):*
   - Sunset Sail on the Motunui — luxury catamaran, 90-120 min, Intracoastal sunset
   - Mimosas, Mansions & Megayachts cruise — 90 min, daytime, Palm Beach waterfront mansions

   *Bookstore (1):*
   - Classic Bookshop (Worth Avenue, Palm Beach) — independent, well-curated

   *Sport (1):*
   - Palm Beach Par 3 Golf Course — oceanfront, short, accessible, walkable

   For each venue: write `blurb` and `bestFor` in Encore voice. Specific over adjective. Tag `vibe` thoughtfully (3-5 tags max). `typicalDuration` is a real-world estimate.

3. **Define the eight archetypes.** Add these to `seed-data.ts`:

   1. **The Classic** — `['cocktails', 'dinner', 'nightcap']`. Evening, medium intensity. Signal: "Patience and taste." Best for: confident first dinners, second dates, anyone you want to impress without trying.
   2. **The Slow Morning** — `['coffee', 'walk']`. Daytime, low intensity. Signal: "Groundedness and intention." Best for: people who'd rather talk than perform, early stage, mentorship-coded.
   3. **The Salon** — `['cultural', 'cocktails']` or `['cultural', 'dinner']`. Evening, medium. Signal: "Curiosity and substance." Best for: thoughtful women, second or third dates, anyone bored by standard dinners.
   4. **The Big Swing** — `['water', 'dinner', 'nightcap']`. Evening, high intensity. Signal: "Generosity and time." Best for: special occasions, women who appreciate scale, anyone who needs to make up for something.
   5. **The Long Walk** — `['walk', 'dinner']` or `['cocktails', 'walk', 'dinner']`. Flexible time, low to medium. Signal: "Comfort and rhythm." Best for: people who get talkative when they're moving, second dates that need oxygen.
   6. **The Off-Hours** — `['brunch', 'browse']` or `['brunch', 'cultural']`. Daytime, low intensity. Signal: "Ease and curiosity." Best for: weekends, people who don't drink, daytime chemistry.
   7. **The Activity** — `['activity', 'dinner']`. Daytime to evening, medium. Signal: "Energy and ease." Best for: athletic women, people who hate small talk, anyone who connects through doing.
   8. **The Quiet Room** — `['dinner', 'nightcap']` (just two stages, both dialed-down and intimate). Evening, low intensity. Signal: "Attention and care." Best for: deep conversation, third date and beyond, women who like to be heard.

   Each archetype gets all fields populated. `description` is one sentence in Encore voice describing the shape.

**Acceptance:** `seed-data.ts` exports `venues` (~30) and `archetypes` (8). All `Venue` and `Archetype` records type-check. The old `restaurants` and `experiences` exports are gone. Any v1 imports in the codebase that referenced them now break and will be fixed in Phase 8 and 9.

**Commit:** `phase 7: venue library and archetypes`

---

## Phase 8: Curation engine v2

Update the system prompt and API route to think in archetypes and produce multi-stage packages.

**Steps:**

1. **Rewrite `/lib/encore-prompt.ts`.** The exported function `buildSystemPrompt(venues, archetypes)` returns a system prompt that:

   - Establishes Encore's voice (savvy older friend, dry, specific, not a chatbot)
   - Provides the full venue list and archetype list inline as structured data
   - Frames the model's job as **selecting three distinct archetypes** and instantiating each one with real venues from the seed list
   - The three packages MUST come from three different archetypes. No two packages with the same `archetypeId`. Differentiation is the point.
   - For each package, the model:
     - Picks an archetype that fits the intake answers
     - Selects venues for each stage from the seed list, respecting category compatibility (a `dinner` stage needs a `restaurant`-category venue; a `walk` stage needs a `walk`/`garden`/category venue; etc.)
     - Writes the `headline` calibrated to her specifically (one sentence, Encore voice)
     - Writes a `signal` phrase (2-4 words, distilled from the archetype's signal but tuned to this date)
     - Writes the `narrative` arc (3-5 sentences, dry and specific, never marketing)
     - Writes 2 `conversationStarters` calibrated to what the user said about her
     - Writes 1 `dontBringUp` item (subtle, kind, never preachy)
     - Estimates a price range as `{ low, high, perPerson: true }` and writes the `conciergeFeeNote` as a single neutral sentence (e.g., "Includes a 7% Encore concierge fee, itemized on your final bill at the venue.")
     - Writes a `why` line for each stage (one sentence on why this venue at this point)
     - Writes a `transition` line for each stage except the last (one sentence on how to move to the next stage; this is where pacing shows up)
   - **Day-of-week awareness:** the prompt explicitly notes that some venues are softer on Wednesdays or that Norton has Thursday evening hours, and the model should weave that into `why` or `transition` copy where relevant. This is the seed of Rob's "right table at the right time" idea.
   - **Forbidden language list** (carry forward from v1, expand): em dashes, "curated," "tailored," "personalized," "experience" as marketing noun, "I'm here to," "let me," "perfect for," exclamation points beyond one per package
   - Output format: enforced via Anthropic tool use. Define a tool `present_packages` with a strict JSON schema matching `{ packages: Package[] }` (length exactly 3). Force the model to use this tool.

2. **Update `/app/api/curate/route.ts`** to:
   - Accept POST with `IntakeAnswers`
   - Call Anthropic with the new system prompt, current Sonnet model identifier (verify via `@anthropic-ai/sdk` README at build time; do not invent)
   - Parse the tool use response
   - **Hydrate venues server-side:** for every stage in every package, look up the full `Venue` object by `venueId` from the seed and attach it as `stage.venue`. Drop the package and log an error if any `venueId` doesn't resolve. The client should never receive a stage with a missing venue.
   - Validate package count is 3 and archetypes are distinct; if not, retry once with a corrective system message, then fail gracefully
   - Return `{ packages: Package[] }`

3. **Error and edge cases:**
   - Missing `ANTHROPIC_API_KEY`: return a friendly error the UI can display
   - Rate limit: surface a "Please try again in a moment" message
   - Invalid model output after one retry: surface a quiet failure, don't expose technical detail to the user

**Acceptance:** Hitting `/api/curate` with sample intake answers returns three packages, each with a different `archetypeId`, each with 2-4 hydrated stages where every stage has a real venue from the seed. The narrative voice reads like Encore, not like a chatbot. Day-of-week mentions appear when relevant.

**Commit:** `phase 8: curation engine v2`

---

## Phase 9: Results and detail UI for sequences

Update the user-facing pages to show structural variety and the new sequence view.

**Steps:**

1. **Rewrite `/app/results/page.tsx` cards.** Each of the three package cards now shows:
   - **Archetype name** at top in Cormorant (e.g., "The Long Walk")
   - **Shape strip** below the name: a small horizontal sequence visual using stage kind labels separated by a thin connector character. Example for The Classic: `Cocktails — Dinner — Nightcap`. Use the en dash, not em dash. Render in muted text, small caps, letter-spaced. This is the at-a-glance differentiator.
   - **Headline** below the shape strip, Inter italic, calibrated copy
   - **Signal pill** in brass-bordered chip style, single line (e.g., "Patience and taste")
   - **Lead venue line:** "Starts at [first stage venue name], [neighborhood]"
   - **Price estimate:** `$XXX-XXX per person`
   - **CTA:** "See the evening" → `/package/[id]`

   The three cards stack vertically on mobile, sit in a row on desktop. They should look DIFFERENT from each other immediately — different archetype names, different shapes, different signals. If they look samey, the prompt isn't doing its job.

2. **Rewrite `/app/package/[id]/page.tsx`.** The detail page now renders the full sequence. Sections, in order:

   - **Hero:** archetype name (Cormorant, large), headline (Inter italic, muted), signal phrase as a small brass-bordered pill below
   - **The evening** — narrative paragraph (Cormorant body, slightly larger than default body)
   - **The sequence** — this is the new core section. For each stage in `package.stages`, render a block:
     - Order number (small, brass, e.g., "01", "02", "03") and `timeOfEvening` next to it
     - Stage kind as a small label (e.g., "COCKTAILS", "DINNER", "NIGHTCAP") in muted small caps
     - Venue name (Cormorant, medium) and neighborhood (Inter, muted, small)
     - One-line `why` (italic Cormorant, muted)
     - Venue blurb (Inter body, smaller, in `--text-muted`)
     - Practical line: dress code if present + parking if present, comma-separated, small Inter
     - **Transition note** between stages (not after the last one): centered, italic, very muted, prefixed with a small brass dot or arrow. This makes the pacing visible.
   - **Two things to ask her about** — two bullets in Cormorant italic, conversation starters
   - **One thing to skip tonight** — single line in muted text
   - **What this evening costs** — new section. Shows:
     - Price estimate range (Cormorant, medium): `$XXX-XXX per person`
     - Concierge fee note in muted small text immediately below: the `conciergeFeeNote` string from the package
     - This is the only place the monetization model surfaces; do not turn it into a sales pitch
   - **Book this evening** — large brass CTA → `/confirm?packageId=...`
   - **See the other two** — secondary muted link → `/results`

3. **Update `/app/confirm/page.tsx`** copy (minor): add a single line acknowledging the concierge fee in small muted text below the main confirmation message: "A 7% concierge fee is included and will appear itemized on your bill at the venue." No design change beyond that.

4. **Mobile pass on the sequence section.** The numbered stages should stack cleanly on a 375px viewport. Transition notes should not feel cramped.

**Acceptance:** Three structurally different package cards on `/results`. Clicking each takes you to a detail page that clearly visualizes the sequence with stages, transitions, and the price disclosure. Voice still holds. No em dashes anywhere.

**Commit:** `phase 9: sequence UI`

---

## Phase 10: Polish, voice review, redeploy

**Steps:**

1. **Voice review pass.** Read every piece of user-facing copy out loud. Anything that sounds like an AI demo, rewrite. Particular hot zones:
   - Landing headline and subhead
   - Intake step lead-ins
   - Loading state copy on `/results`
   - Archetype names and signals (these appear in many places; if any name reads as cute or AI-generated, fix it once and propagate)
   - Confirmation page

2. **Variety check.** Run the intake flow at least three times with different sample inputs (e.g., "athletic, just back from Aspen" / "she reads a lot, late 60s, recently widowed" / "younger, ~40, works in finance"). Confirm:
   - Each run produces three structurally different archetypes
   - Across the three runs, the system selects from a meaningful subset of the eight archetypes (it should not always pick The Classic)
   - The conversation starters change meaningfully across runs
   - If the variety is poor, tighten the prompt before shipping

3. **Mobile sweep.** Every page on a 375px viewport. Sequence stages, signal pills, shape strips on the results cards.

4. **Update `README.md`.** Reflect the new architecture in one paragraph: "Encore designs evening sequences, not single recommendations. The system selects from eight archetypes and instantiates each with real West Palm venues."

5. **Redeploy to Vercel.** Same project, push to main. Confirm `ANTHROPIC_API_KEY` is set in env. Walk the live site end-to-end.

6. **Stop.** Note rough edges and follow-up ideas in `FOLLOWUPS.md`. Do not fix them.

**Acceptance:** Live site reflects all v2 changes. Voice is tight. Variety is real. Stop here.

**Commit:** `phase 10: v2 polish and redeploy`

---

## After phase 10: stop

Do not add features beyond Phase 10. The product is now ready for Rob to walk through. Wait for direction before building anything else.
