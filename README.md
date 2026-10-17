# Radicato — Website

Static, mobile-first marketing site for Radicato (Boone, IA preorder/pickup meal service).
Prototype v1 — design under review, not yet customer-facing.

## Stack
- Plain HTML/CSS/JS + JSON (no framework, no build step — trivial to migrate)
- Menu renders from `data/menu.json` (edit this file weekly; site updates automatically)
- Order buttons link to GoPrep: https://radicato.goprep.com/customer/menu

## Deploy
Hosted on GitHub Pages from this branch. Live URL: https://starling72-biz.github.io/radicato-site/
After design approval: point custom domain `radicatokitchen.com` here (or migrate to Hostinger VPS).

## Update menu weekly
Edit `data/menu.json` — weekLabel, items[] (tag/name/desc/price/new/serves). Push to main; Pages rebuilds automatically.

### Order cutoff / reopen (menuStatus)
- `closeAt` (ISO time with offset): after this, the menu section shows
  "Orders for this week are closed. Next menu opens Friday."
  The day name follows `reopenDay` (default `"Friday"`). No clock time is shown —
  the open time varies week to week.
- The "coming soon" fallback starts at the beginning of that day (midnight, Boone time)
  after `closeAt`. `reopenTime` is still accepted if present, for compatibility, but
  it defaults to `"00:00"` and is never included in the copy.
- `reopenAt` (optional) overrides that instant if it falls within 14 days after
  `closeAt`; anything further out (e.g. the old `2099-12-31` placeholder) is ignored.
- From the start of that day, if `menu.json` hasn't been updated (`closeAt` is still
  in the past), the site hides last week's dishes and shows
  "New menu coming soon. Check GoPrep for the latest." with a button to GoPrep,
  instead of staying on "closed" or claiming the new menu is already up.
- To preview a time locally, add `?now=` to the URL:
  - `http://localhost:8000/?now=2026-10-21T08:59:00-05:00` — menu cards
  - `http://localhost:8000/?now=2026-10-21T09:00:00-05:00` — "Orders for this week are closed. Next menu opens Friday."
  - `http://localhost:8000/?now=2026-10-23T00:00:00-05:00` — "New menu coming soon. Check GoPrep for the latest."
