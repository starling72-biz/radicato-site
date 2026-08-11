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
