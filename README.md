# Wedding Planner

An AI wedding planner. It interviews the couple, records their answers, and turns them into a plan with an estimated cost.

```
Customer → Interview (AI listens) → asks about budget, style, food…
        → records the answers
        → Venues · Food · Vendors · Guest list
        → Estimated cost for the event
```

## What it does

1. **Interview.** The planner asks one question at a time: names, date, location, guest count, budget, style, ceremony, food, dietary needs, vendors and must-haves. You can type or tap the mic and talk (browser speech recognition). Each answer is filled into the "What we've recorded" panel.
2. **Venues.** Claude searches the web and returns the top 5 venues that fit the couple's location, style, capacity and budget. For each one you can:
   - **Pick** it for your shortlist.
   - Flip through the shortlist in a **slideshow**.
   - **Configure** add-ons (for example an on-site ceremony or an extra hour).
   - Choose or **change your favorite**.
   - See the **price**, recalculated for your guest count and add-ons.
3. **Food.** The same top 5 / pick / slideshow / configure / favorite flow for caterers and menus, priced per guest.
4. **Vendors.** The same flow for each vendor type the couple needs (photographer, florist, DJ…). You can add your own vendor types.
5. **Guest list.** Add guests one at a time or paste a list. Track RSVPs, plus-ones and meal choices. Once the list is complete, it sets the headcount used for pricing.
6. **Estimated cost.** Adds up your favorite venue, food and vendors, plus an adjustable contingency/tax/tips percentage, and compares the total to your budget.

The plan is saved in your browser, so a refresh doesn't lose anything.

## Running it

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Without an `ANTHROPIC_API_KEY`, the app runs in **demo mode**. The interview is scripted and the recommendations are sample data, so you can try the whole flow offline.

## How it's built

- Next.js (App Router) + TypeScript, no UI framework.
- `app/api/interview`: each turn sends the conversation to Claude, which returns its next question plus the updated profile as structured JSON (`lib/schemas.ts`).
- `app/api/recommend`: two Claude calls. The first uses web search to research real businesses near the couple; the second turns those notes into 5 priced options with configurable add-ons (structured JSON). They're separate because search results carry citations, which structured output doesn't accept.
- `lib/cost.ts`: all pricing math (headcount, add-ons, totals).
- `lib/demo.ts`: offline stand-ins used in demo mode.

## Tests

```bash
npm run typecheck   # TypeScript
npm test            # unit tests: pricing, headcount, demo data
npm run test:e2e    # browser test of the whole flow in demo mode
```

CI runs all three on every push (`.github/workflows/ci.yml`).
