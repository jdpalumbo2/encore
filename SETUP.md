# How to run this

Three files, one workflow.

## Order of operations

1. **Create an empty repo and cd into it.**

   ```bash
   mkdir encore && cd encore
   git init
   ```

2. **Drop `CLAUDE.md` and `Buildplan.md` at the repo root.** Don't add `KICKOFF.md` to the repo — that's just your prompt to paste.

   ```bash
   cp /path/to/CLAUDE.md ./CLAUDE.md
   cp /path/to/Buildplan.md ./Buildplan.md
   git add . && git commit -m "chore: spec files"
   ```

3. **Open Claude Code in this directory.**

4. **Paste the contents of `KICKOFF.md` as your first message to Claude Code.**

5. **Make sure your Anthropic API key is available.** Either export it before starting Claude Code or set it in `.env.local` once Phase 0 is done:

   ```bash
   echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
   ```

6. **Watch the phases roll.** Phase 0 → 6 should run end-to-end with commits at each gate. If Claude Code stops to ask something, it means the spec was unclear; answer and let it continue.

7. **At the end, you'll have a live Vercel URL.** Send that to Rob.

## If something goes sideways mid-build

Per CLAUDE.md, Claude Code is told to stop and report at phase boundaries. If a phase produces something off-brand (e.g., a chatbot-sounding headline or a Tailwind-default look), interrupt it before it auto-continues, point at the section of CLAUDE.md it violated, and have it redo that piece. Don't let voice drift compound across phases.

## Things to review before shipping to Rob

- Voice on the landing page. Read it out loud. If it sounds like an AI demo, rewrite.
- The three package types ("The Classic," "The Off-Note," "The Big Swing"). The names should land. Change them in `encore-prompt.ts` if you want different framings.
- The conversation starters. These are the magic moment of the demo. If they're generic, the demo dies. Tweak the system prompt until they feel sharp.
- Mobile. Rob will probably open it on his phone first.
