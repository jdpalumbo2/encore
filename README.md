# Encore

A curated date concierge for older men in West Palm Beach. The user describes a date, gets three options (The Classic, The Off-Note, The Big Swing), picks one, and mock-confirms an evening built around a real West Palm restaurant and an optional add-on.

This repo is the demo MVP. No database, no real payments, no auth.

## Stack

- Next.js 16 (App Router) + TypeScript strict
- Tailwind CSS v4
- shadcn/ui primitives where useful
- `@anthropic-ai/sdk` against the current Sonnet (`claude-sonnet-4-6`)
- Vercel for deploy

## Run locally

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

Open <http://localhost:3000>.

## End-to-end flow

1. `/` — landing page
2. `/plan` — five-step intake
3. `/results` — fires `/api/curate` with the brief, renders three packages
4. `/package/[id]` — full evening detail
5. `/confirm` — mock confirmation

State lives in `sessionStorage` under `encore.intake` and `encore.packages`. There is no persistence beyond the browser session.

## Curation engine

- System prompt: `lib/encore-prompt.ts`
- API route: `app/api/curate/route.ts`
- Seed data (restaurants and experiences): `lib/seed-data.ts`
- The model is forced to call a `present_packages` tool whose schema constrains `restaurantId` and `experienceId` to enums of seed ids. The route then hydrates those references back into full nested objects.

## Deploy

```bash
npm i -g vercel
vercel link
vercel env add ANTHROPIC_API_KEY production
vercel --prod
```

Make sure `ANTHROPIC_API_KEY` is set in the Vercel project for both Preview and Production.

## What this isn't

No database, no Stripe, no auth, no analytics, no marketing pages. See `CLAUDE.md` for the full list.
