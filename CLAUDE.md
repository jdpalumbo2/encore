# CLAUDE.md

Project conventions for Encore. Read this before doing anything. Reread it when you switch phases.

## Project

Encore is a curated date concierge for older adults in West Palm Beach. This repo is the demo MVP a stakeholder will poke at to see whether the concept works. It is not production. It is not a prototype that has to scale. It is a tight, polished, end-to-end walk-through of the product experience.

The user describes a date scenario (who the guest is, when, what kind of evening), gets three curated package options, picks one, sees a full evening with restaurant + optional add-on + conversation primers + logistics, and mock-confirms a booking.

There is no real Stripe, no auth, no database. State lives in React and URL params.

## Audience

Primary: adults aged 50 and up in West Palm Beach, any gender. Divorced, widowed, or otherwise returning to dating after a long absence. Have money, have time, lack the social muscle memory for the modern restaurant scene. The voice locks on this audience and stays there. Every copy decision answers to them.

Secondary: busy professionals in their thirties and forties planning a meaningful night for a partner, a spouse, or someone they want to impress. We do not address this audience separately. We expect them to find the product on their own and translate the register without help.

We do not target college-age daters, casual swipers, or out-of-town tourists. Encore is for the person who already has the relationship or the night and needs the curation.

The product never assumes anyone's gender. Copy refers to "your guest" or uses "they." The curation prompt mirrors whatever pronouns the client uses in the brief and defaults to neutral when none are given. The intake field, database column, and prompt all say "guest," never "her."

## Product philosophy

Encore wins by giving so much value at the package level that the user does not want to shop it around. The conversation starters, the why-this-venue lines, the transition notes between stages, the don't-bring-up aside, the dress code, the parking. Every one of these is a small gift that costs the user nothing and costs us a few cents of Sonnet tokens. Together they make the user feel taken care of in a way that a Yelp tab or a restaurant website cannot match.

Detail density at the package level is a feature, not bloat. We do not strip information to "simplify" the design.

In a product without product photos, without celebrity endorsements, without testimonial reels, the voice carries the weight that visual flourish would carry elsewhere. The voice is the brand. If a piece of copy reads like a chatbot or a marketer, fix it before shipping.

## Use cases

Three modes are in scope, in this order of priority:

1. **In-person demos by Rob.** Rob takes an iPad or a phone to a friend, a beta tester, or a restaurant operator and walks them through the product. He wants to skip the brief sometimes and go straight to the magic moment. The product needs to support this.
2. **Self-serve beta testing.** A small group of friendly users, given the URL, walk the flow on their own and produce real feedback. The product needs to be usable end-to-end without anyone over their shoulder.
3. **Future viral self-serve.** Roadmap context only. Anonymous traffic finds the product, walks the flow, books, shares. This shapes what we build later but does not justify building anything specifically for it now.

## Strategic non-goals

The following are deliberately deferred. Each item has a stated trigger for when to revisit.

- **Voice AI assistant.** Rob's "Bordy" idea. A voice that pops up mid-flow to help. Defer until we have enough usage data to know where people actually get stuck. Adding voice now is solving a problem we have not observed.
- **Real Stripe Connect / live payments.** The product mocks a 7 percent concierge-fee disclosure today. Real payments require signed merchant agreements, KYC, liability review. Defer until Rob has at least three restaurants ready to sign.
- **Referral credits, vendor referral credits, contests.** Future marketing mechanics. Defer until self-serve traffic is real.
- **Video testimonials, video reviews.** Defer to a later round; written feedback is sufficient signal for now.
- **Vendor self-serve portal.** Restaurants logging in and managing their listings. Rob is doing onboarding in person on an iPad. Defer until there are more than five vendors to manage and Rob's time is the constraint.
- **Conversational chatbot replacing the intake.** The five-step form works and reads as deliberate, not robotic. Defer until we see real users churning at the intake.
- **One-week post-date follow-up email.** Rob wants "Are you seeing that gal again?" a week later. Defer until the morning-after email is shipped and used.
- **Embedded photos, vendor logos, hero imagery.** The visual identity is locked. Type and color carry it. Adding imagery would compromise the editorial register.
- **User accounts, login, password reset.** No accounts ever, until product-market fit is real. Anonymous session cookies are sufficient.

## Mobile-first reminder

Rob's primary surface is an iPad or a phone. He has said reading on a phone was the hardest part of the experience. A 375px-viewport audit is required for every user-facing change from this point forward. Touch targets are 44 pixels minimum. Body text is 16 pixels minimum. Caps eyebrows are 13 pixels minimum. Brass on warm off-white must use the darker brass-text token; the lighter brass is for backgrounds and borders only.

If a change cannot be audited at 375px before ship, the change is not done.

## Voice on outbound communications

When the product communicates outside the app, the voice rules apply identically. This covers itinerary emails, morning-after notes, booking confirmations, and anything else that lands in an inbox.

- No exclamation points in subject lines.
- No "Hi {firstname}!" energy. Use no greeting or a single-name greeting on its own line.
- No marketing footers, no unsubscribe spam, no "powered by Encore" tags.
- Subject lines read like a note from a friend. "How was Boulud?" beats "Tell us about your experience."
- Specific over generic. Reference the venue, the night, the detail that calibrates.
- Plain text where it reads cleanly. HTML only when typography earns it.

## Active roadmap

This list is conditional on Rob's answers to the questions in `QUESTIONS-FOR-ROB.md`. Priority order, with what triggers each item:

1. **Mobile + accessibility ship.** Already done in the v2 a11y pass. Maintained going forward.
2. **In-person demo mode.** Depends on Rob's answer to question 3. Likely a "Show me a sample" path on the homepage that skips the intake.
3. **Itinerary email on booking.** Depends on Rob's answer to question 1. Requires email capture, a Resend-style integration, and a transactional template.
4. **Morning-after note.** Depends on Rob's answers to questions 1 and 2. Requires a daily cron job that reads `bookings` and sends.
5. **Light review capture.** Depends on Rob's answer to question 2. A short link in the morning-after email to a one-question reflection page. Server-side storage.
6. **Venue expansion.** Rob has more venues he wants to add. Editorial work, no architectural change. Slot in whenever Rob has the list.

Items not on this list are not happening this round. See `## Strategic non-goals` for the reasoning.

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
- Light, dry, never cute. The audience is 50+ adults with money. Treat them like adults.

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
