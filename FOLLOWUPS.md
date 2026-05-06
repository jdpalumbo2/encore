# Follow-ups

Things noted during the build but intentionally not done. Wait for direction before picking these up.

## Verified locally? No.

I had no `ANTHROPIC_API_KEY` available at build time, so the live curation call was never end-to-end tested from this machine. The first thing to do after deploy: walk the flow once on the live URL and confirm the model returns three packages in the right shape and voice. The graceful error path will kick in if the key is missing or the model misbehaves.

## Voice drift surface area

The system prompt forbids "curated," "tailored," "personalized," and similar tells, but the model will still produce drift on certain briefs. The two riskiest places:

- `narrative` — if it gets vague, it will reach for adjectives. Worth keeping an eye on across a few real test runs.
- `conversationStarters` — these are the "magic moment" of the demo. If they read generic, the demo dies. Tune the prompt's example/instruction language if the first few runs feel flat.

## Empty / direct-link behavior

`/results`, `/package/[id]`, and `/confirm` all redirect to `/plan` (or `/`) when sessionStorage is empty. That works but is silent. A short explanatory line on the redirected page ("the brief expired, start over") would be friendlier. Skipped to stay in scope.

## Package-detail refresh

The detail page reads from sessionStorage. A page refresh works because the data is still there, but a deep-linked share won't. For the demo this is fine; for a real product the packages would need a server-side store keyed by an opaque id.

## "And before/after" inference

The package detail page infers "before" or "after" for the experience section by looking at the `pairsWellWith` string. It's a coarse heuristic. A typed enum on `Experience` (`pairing: "before" | "after"`) would be cleaner.

## Mobile pass

Tested at 375px in build output; layouts collapse cleanly because of the single-column grid stacks. Has not been tested in a real device emulator. Worth a quick spot-check before sending the URL to Rob.

## Favicon

A simple SVG (brass "E" on navy) is in `public/favicon.svg`. No `apple-touch-icon`, no PNG fallbacks. Acceptable for a demo; trivial to upgrade.

## ESLint warnings

`npm run build` is clean. `npm run lint` was not run as part of the build pipeline; consider adding to CI.
