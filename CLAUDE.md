# CLAUDE.md

Project conventions for Encore. Read this before doing anything. Reread it when you switch phases.

## Project

Encore is a curated date concierge for older men in West Palm Beach. This repo is the demo MVP a stakeholder will poke at to see whether the concept works. It is not production. It is not a prototype that has to scale. It is a tight, polished, end-to-end walk-through of the product experience.

The user describes a date scenario (who she is, when, what kind of evening), gets three curated package options, picks one, sees a full evening with restaurant + optional add-on + conversation primers + logistics, and mock-confirms a booking.

There is no real Stripe, no auth, no database. State lives in React and URL params.

## Stack (locked)

- Next.js 15, App Router, TypeScript strict mode
- Tailwind CSS v4
- shadcn/ui where it speeds things up; otherwise hand-rolled components
- `@anthropic-ai/sdk` for the curation engine
- Vercel for deployment
- No backend beyond Next.js API routes
- No database

If a dependency isn't in this list, justify it before adding.

## Voice

The product speaks like a savvy older friend who happens to know the city. Confident, dry, never a chatbot. Imagine a New Yorker columnist who got into the concierge business.

**Forbidden in user-facing copy:**
- Em dashes (use commas, periods, or parentheses)
- AI-startup language: "curated experiences," "tailored just for you," "powered by AI," "let me help you"
- "I'm here to help," "happy to assist," any chatbot register
- Emoji
- More than one exclamation point per page
- Hedge words: "perhaps," "maybe," "could be," "might enjoy"

**Preferred:**
- Specifics over adjectives. "Two glasses of Sancerre and a quiet table on the side patio" beats "a romantic evening."
- Imperative CTAs. "Plan the night." not "Click here to plan your night."
- Light, dry, never cute. The audience is 50+ men with money. Treat them like adults.

## Visual identity

These are the only colors. Use Tailwind config to expose them.

```
--background:  #FAF7F2  (warm off-white)
--surface:     #F0EBE3  (warm grey for cards)
--primary:     #1A2840  (deep navy)
--accent:      #B8985A  (brass)
--text:        #2C2C2C  (charcoal)
--text-muted:  #6B6760  (warm grey)
--hairline:    #E5DFD5  (border lines)
```

Type:
- Headlines: **Cormorant Garamond** (Google Fonts), weight 500. Generous letter spacing for display sizes.
- Body: **Inter** (Google Fonts), 400 / 500 / 600. Standard tracking.

Layout principles:
- Generous whitespace. The product should feel like the lobby of a good hotel, not an app.
- Hairline borders (1px in `--hairline`) instead of drop shadows.
- No gradients. No shadows except subtle `shadow-sm` on hover states.
- Max content width: 720px for prose, 1100px for layouts with cards.
- 8px spacing scale. Stick to Tailwind's default spacing.

## Code conventions

- Functional components only
- Server components by default. `'use client'` only when actually needed (forms, state, animations)
- TypeScript strict. No `any` unless commented why.
- Tailwind classes inline. No CSS modules. Only `app/globals.css` for resets and font setup.
- Folder structure under `/app` follows Next.js App Router. Routes are `/`, `/plan`, `/results`, `/package/[id]`, `/confirm`.
- Shared UI components in `/components`. Encore-specific composite components in `/components/encore`. Primitives from shadcn in `/components/ui`.
- Business logic in `/lib`. Seed data in `/lib/seed-data.ts` with explicit TypeScript interfaces.
- Use `clsx` + `tailwind-merge` (via a `cn` helper) for conditional classes.

## LLM integration

- All Anthropic SDK calls happen server-side in `/app/api/curate/route.ts`
- Model: `claude-sonnet-4-5` (or whatever the current Sonnet identifier is when you build it; check the Anthropic SDK README if unsure, do not invent a model name)
- The system prompt for the curation engine lives in `/lib/encore-prompt.ts` and pulls the seed data inline
- Output format: structured JSON. Use Anthropic's tool-use feature to enforce schema.
- Stream the response if it improves perceived speed; otherwise return JSON. Don't over-engineer.
- Error states must be designed, not just `alert()`. If the API fails, the user sees a graceful fallback.

## Phase discipline

Build follows `Buildplan.md` phase by phase.

At every phase boundary:
1. Stop, briefly report what was built and what you decided
2. Commit with a clean message scoped to that phase, format: `phase N: <what>`
3. Auto-continue to the next phase unless requirements are unclear

If a requirement is genuinely unclear or the buildplan contradicts itself, stop and ask. Do not invent product decisions.

If you find yourself adding scope not in the buildplan ("I should also add X"), stop. Note it as a follow-up. Don't add it.

## What not to do

- Do not add a database. State is React + URL params + localStorage if absolutely needed.
- Do not add real Stripe integration. The booking confirmation page is a mock.
- Do not add auth. There is no user account.
- Do not add analytics, cookie banners, GDPR notices, or marketing pages.
- Do not add a contact form, newsletter signup, social links, or "About" page.
- Do not add dark mode unless the buildplan asks for it.
- Do not refactor or "clean up" code from earlier phases unless explicitly told to.
- Do not over-build. This is a demo for one stakeholder to walk through. Quality over surface area.
