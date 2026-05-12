# QUESTIONS-FOR-ROB.md

Two text messages for Johnny to send Rob. The first sets context. The second has the questions.

---

## Message 1 — context

> Hey Rob, before I send the questions, here's what's already decided so you can see the full picture.
>
> Stuff I'm just doing, no input needed:
>
> - Mobile reading is fixed. Bigger text, better contrast, easier on a phone. Already shipped.
> - Itinerary email at booking. Once you confirm the night, we send a clean recap to the inbox. Same voice as the product. No marketing footer.
> - Adding more venues. If you want me to add a few more spots, send me the list and I'll add them. No design changes needed.
> - Admin dashboard already tracks who's using it, where they drop off, which archetypes get picked, what it costs to run. You can pull the data anytime.
>
> Stuff I'm deliberately not building this round, even though we talked about them:
>
> - Voice AI ("Bordy"). You said later, I agree. Not until people show us where they actually get stuck.
> - Real Stripe payments. Mock for now. Real when you have signed restaurants.
> - Contests, referral credits, vendor credits. Future marketing mechanics.
> - Video reviews. Written feedback is enough signal for now.
> - One-week follow-up email. After the morning-after email is shipped and used, then we revisit.
> - A vendor portal where restaurants log in. You're doing that in person on an iPad. Doesn't need a product.
>
> Three real questions below that I genuinely can't answer without you. Whisper Flow them whenever.

---

## Message 2 — the three questions

> **1. Where do we ask for the email?**
>
> The morning-after email is the easy half of your follow-up idea. The hard half is, we have to capture the email somewhere before we can send it. Right now we ask for nothing personal except the description of her. Three options:
>
> A. Add an email field as a sixth step in the intake form, before they see the three options.
>
> B. Ask for email only on the confirm screen, after they've booked the night. So they only give it if they actually commit.
>
> C. Skip the morning-after email for v1. Just the itinerary email at booking, no email collection during intake at all (we just send the itinerary back to whatever address they enter at the booking moment).
>
> My recommendation: B. Asking for email upfront slows down the brief and might cost us submissions. Asking on the confirm screen catches the people who are actually serious and keeps the intake fast.
>
> **2. What does the morning-after email actually say?**
>
> Three flavors. Same person sending all of them, different posture:
>
> A. Just a check-in. "Hey, how was Boulud?" with a one-tap reaction (loved it, mixed, not for me). No itinerary repeat, no link to write a review. Short, intimate, like a text from a friend.
>
> B. A check-in plus the full itinerary recap underneath. "Here's how the night went, in case you want to remember the order." More useful as a keepsake, slightly more email-y.
>
> C. A check-in plus a link to a one-question reflection page on the site. ("What stuck? Reply in a sentence.") This generates signal for us about what landed.
>
> My recommendation: C. We need the feedback to keep tuning the product, and a one-question page is light enough that it'll feel like a conversation, not a survey. The voice still does the work.
>
> **3. How do you show Encore to someone on your iPad in person?**
>
> Right now the homepage routes everyone straight to the brief. To show someone what the product produces, you either fill out the brief yourself in front of them (slow, breaks the moment) or you pre-bake a brief before the meeting (you've memorized it). Three options:
>
> A. Add a quiet "Show me a sample night" button on the homepage. One tap loads a prebuilt evening into the detail view, no brief required. Demo to anyone in fifteen seconds.
>
> B. Build short URLs you can hand out, like encore.com/sample/the-classic. Same idea but the link itself is the demo.
>
> C. Keep it as-is. You walk the person through the real brief. Slower but they see the brief is part of the value.
>
> My recommendation: A. Lives on the homepage where the demo already starts. Doesn't pollute the URL space. Two seconds from "let me show you" to the magic moment.

---

## Notes for Johnny on sending

- Send message 1 first. Wait an hour or two so Rob can read it before the questions land.
- When Rob responds via Whisper Flow, paste his answers verbatim into a new file `ROB-ANSWERS.md` at the repo root. The next Claude Code session will read that file and the existing `CLAUDE.md` to build the next phase plan.
- If Rob volunteers anything beyond the three questions (he often will), capture it in `ROB-ANSWERS.md` under a "Bonus" section. Don't ignore it; it might surface a fork I missed.
- If Rob picks an option I didn't recommend, take him at his word. He owns the audience read; the recommendations are my best guesses, not the right answer.
- Once `ROB-ANSWERS.md` exists, ping me with "ready to write the v3 buildplan" and I'll synthesize his answers into a phased plan that respects what's already in `CLAUDE.md` (especially the strategic non-goals).
