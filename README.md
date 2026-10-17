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
  "Orders for this week are closed. Next menu opens <day, date at time>."
- Next opening is derived automatically: the first `reopenDay` at `reopenTime`
  (Boone time) after `closeAt`. Defaults: `"reopenDay": "Friday"`, `"reopenTime": "08:00"`.
  Both are optional keys inside `menuStatus`.
- `reopenAt` (optional) overrides the derived time if it falls within 14 days after
  `closeAt`; anything further out (e.g. the old `2099-12-31` placeholder) is ignored.
- If the reopen time passes and `menu.json` hasn't been updated yet, the site hides
  last week's dishes and shows a "This week's menu is up" button to GoPrep instead of
  staying stuck on "closed".
- To preview a time locally, add `?now=` to the URL, e.g.
  `http://localhost:8000/?now=2026-10-21T10:00:00-05:00`.
