# Follow-ups

Open notes after the audit pass. Anything resolved is no longer listed here.

## Live API: still unverified from the build machine

I had no `ANTHROPIC_API_KEY` available at any point in this session. The live curation call has not been end-to-end tested. After the key is set on Vercel, walk the flow once and confirm the model returns three packages in the right shape and voice. The graceful error path is wired up if the key is missing or the call fails.

## Voice drift on a real run

The system prompt is now explicit about good vs. bad output for the narrative, conversation starters, and don't-bring-up fields, with inline examples. Even so:

- The first three or four real runs are worth reading line by line. If the conversation starters drift toward topic headers ("Ask about her travels.") instead of actual sentences, sharpen the example pair in `lib/encore-prompt.ts`.
- If the narrative gets vague, the most effective lever is adding one more concrete example narrative in the prompt.

## Package-detail refresh / deep-link share

The detail page reads from sessionStorage, so a refresh works but a shared link to `/package/classic` from another browser will hit the empty-state. Acceptable for the demo. For a real product the packages would need a server-side store keyed by an opaque id.

## Loading-state min display time

`/results` shows "Crafting three options…" while the API runs. If the cache is warm and the response returns under ~80ms the loader can flicker. Not happening in practice with a real LLM call (they take seconds), but worth a `min-display-time` if anyone ever fronts this with a cache.

## Package detail title

`app/package/[id]/page.tsx` updates `document.title` in a `useEffect` once the package is loaded, since the page is a client component reading from sessionStorage. Works, but it's a workaround. If the data ever moves to the server (an opaque id with a server-side store), switch to `generateMetadata`.

## ESLint set-state-in-effect rule

React 19's `react-hooks/set-state-in-effect` rule is disabled for `app/**/*.tsx` in `eslint.config.mjs`. Bridging `sessionStorage` (a browser-only side channel) into React state on mount is exactly what an effect is for; the rule produces false positives here. The cleanest long-term fix would be `useSyncExternalStore` over a sessionStorage subscription, but it adds complexity that isn't worth it for the demo.

## Mobile

Tested at 375px in CSS terms (single-column stacks, generous touch targets). Has not been opened in a real device emulator. Worth a 30-second spot-check before sending the URL to Rob.

## Favicon

`public/favicon.svg` is a brass "E" on navy. No `apple-touch-icon`, no PNG fallbacks. Acceptable for a demo.

## CI / lint pipeline

`npm run lint` is now clean. Adding it to a CI step would prevent regressions; not wired up.
