# QUESTIONS-FOR-ROB-2026-09-29.md

The dinner questionnaire Johnny promised Rob on the 2026-09-29 Zoom. One email, fifteen questions, about 30 to 45 minutes of Rob's time. Rob said he would answer by Wispr Flow, that night or soon after.

The build waits on the answers. Sources: the call recording (Fireflies archive, "Rob Call 9-29"), Rob's texts of 2026-09-22 to 2026-09-28, and his email of 2026-09-15 ("Change documentation. Encore.") with four attachments, including the StartEngine deck.

**Where the draft is:** saved on 2026-09-29 as a draft in the johnny@simplifytech.ai mailbox, addressed to rbailey@trustedadvisory.com, the address Rob writes from. Not sent.

---

## The email

**Subject:** Encore dinners: questions before I build

> Rob,
>
> Here is what I took from today's call. Correct anything I have wrong.
>
> - Three Palm Beach restaurants, each with valet parking. You have two and will name the third by Friday.
> - A guest picks one of the three, fills in a short form, and agrees to a $15 fee.
> - The request comes to you by email. You phone the restaurant, book the table, and confirm with the guest within 24 hours.
> - The $15 is the same for a party of two or a party of six. Nobody is charged until the reservation is confirmed.
> - The guest pays the restaurant for the meal.
> - You do this by hand for the first 20 guests, so you have numbers to take back to the restaurants.
> - I build it this week with placeholder restaurants and swap in the real ones when you send them.
>
> Now the questions. Short answers are fine.
>
> **The restaurants**
>
> 1. Name the three restaurants. For each one, give me your contact there and where it stands: said yes, said maybe, or not asked yet.
> 2. For each restaurant, give me one or two lines. What kind of evening does it suit (relaxed, special occasion, adventurous, classic)? Where do you send the guest afterward? Your table from Sunday had this for Renato's, Okeechobee Steakhouse and Cafe Sapori. Are those still the three?
> 3. Which nights and times can a guest ask for? Any night, or set nights? How much notice do you need?
>
> **The form**
>
> 4. I plan to ask for name, email, mobile, party size, the date and time wanted, a second-choice date, and the occasion. What would you add or drop?
> 5. Is each booking a private table for that party of two to six? Or do you still plan to seat parties together, with the minimum of four and the five-day cutoff from your Sunday text?
> 6. Where should the requests go? Give me the email address. Do you want a text message as well?
>
> **The $15**
>
> 7. Your September 15 documents put the per-booking fee on hold and moved to membership, and the StartEngine deck says free entry with no commission. Today we agreed on $15 per booking. For these first 20 guests, is the $15 the plan, with membership to follow? I want the build and the deck to say the same thing.
> 8. How will you charge it by hand? A Stripe payment link you email after you confirm, a Stripe invoice, or something else? Is the Encore Stripe account live, or still in sandbox?
> 9. This is the line the guest agrees to before sending the request. Edit it as you like: "Encore charges a $15 fee once your reservation is confirmed. You will not be charged before then. You pay the restaurant for your meal." And if the guest cancels after you confirm, do they get the $15 back?
> 10. If the restaurant cannot take the time the guest asked for, what do you do? Offer another time, or another of the three restaurants?
>
> **What the guest gets**
>
> 11. You called it a goodie bag. What is in it for the first dinners? I can carry over the conversation cues from the current app. You mentioned a note on the restaurant's history. Who writes that? And who sends the confirmation and the next-morning check-in: you, by hand, from your own email, or the system?
>
> **The site**
>
> 12. The three dinners replace the current demo ("Plan the Night"). Do you still need the old demo to show people in person? If yes, I keep it at its own link. And should the guest answer the opening questions first and then see the restaurant that fits, or see all three dinners right away?
>
> **Proof**
>
> 13. What number tells you this works, and by when? For example, 20 confirmed reservations by a date you name.
> 14. What are the top three things you want to do with the member and venue lists in the next 30 days? How many names are in each Notion list today?
>
> **Housekeeping**
>
> 15. Three small things. Which email address should I add to the Vercel project? Is the StartEngine deck from September 15 still the current one, or is there a newer version I should read? And what is the name of the dinner company behind the Happiness Club and Wall Street South evenings, and do you need anything built for those?
>
> As you set up the first dinners, keep a running list of what takes you the most time by hand. That list decides what I build next.
>
> Johnny

---

## Notes for Johnny on sending

- You told Rob on the call he would have this by email within a few hours.
- When Rob answers, paste his answers word for word into `ROB-ANSWERS.md` at the repo root. Anything he volunteers beyond the fifteen goes under a "Bonus" heading.
- If Rob picks something that pushes the build past one day, that item goes on the later list. It does not go into this week's build.
- Questions 1, 4, 6, 7 and 8 are the ones the build cannot start without. The rest can trail by a day.

## Why question 7 exists

Rob's email of 2026-09-15 carried four documents. Two of them conflict with the $15 agreed on the call two weeks later:

- **Encore Value Flow:** the deposit, "a fee to bundle the reservation itself", is "on hold, not gone". The current model "bundles by subscription".
- **ENCORE StartEngine deck (14 slides):** for restaurants, "free entry, no commission". Stage one of the business model is "both sides free". The member "books directly".
- **What is the important mission of encore:** "We are moving to a membership model." Restaurant tiers at about $149 a month (Standard) and $339 a month (Elite), with a 60-day free trial.

The call's $15 per booking brings back the mechanic those documents put on hold. Question 7 asks Rob to confirm which one governs the first 20 guests.
