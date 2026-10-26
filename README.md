# Lune website

The public site and journal for Lune: Moon Rituals. Static, built with [Astro](https://astro.build), so every page is plain HTML that loads fast and ranks well. Its own repo, separate from the app (nayyymarques-eng/Lune). Moved out of the app repo's `website/` folder on 26 Oct 2026 with full history.

```bash
npm install
npm run data     # copy the moon calendar, readings and legal texts from /mnt/project-files (only when they change)
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

## Pages

| Path | What it is |
|---|---|
| `/` | Landing page. Hero with a live "Tonight" card: real phase and sign, pick your sign, see the house it falls on. One form (`#start`) for every CTA |
| `/moon`, `/moon/[sign]` | The moon in each of the 12 signs: next dates, new and full moon readings, where it lands for every Sun sign. Made for search and for per-sign Pinterest pins |
| `/journal`, `/journal/[slug]` | The blog. RSS at `/rss.xml` |
| `/care`, `/privacy`, `/terms` | From Copy's `textos-do-app/lancamento-en.md` (drafts, need a lawyer) |

## Data, never typed by hand

- `src/data/moon.json`: moon engine output (astronomy-engine), 2026 to 2030, UTC.
- `src/data/readings.json`: Copy's readings (`leitura-das-luas/leituras-en.json`).
- `src/content/legal/*.md`: Copy's launch texts.
- `src/styles/tokens.css`: copy of `design-system/tokens.css`. Change the DS, then copy again.

## Writing a journal post (Content role)

Add one markdown file to `src/content/journal/`, kebab-case name = URL:

```md
---
title: "The moon in Aries tonight: a little courage"
description: "About 150 characters for Google and the post card."
date: 2026-11-02
sign: aries          # optional; the closing CTA then speaks to that sign
phase: full_moon     # optional
tags: [moon-in-sign]
cover: /journal/aries-nov.webp   # optional, put the image in public/journal/
draft: false
---
```

Link each post to its sign page (`/moon/aries`). Rules: English, never promise results, astrology as reflection, kinship rule for traditions, no Jewish traditions, sources for any study.

## Launch switches (environment variables)

| Variable | Effect |
|---|---|
| `PUBLIC_APP_STORE_URL` | When set, every CTA becomes "Start your 15-day free trial" and goes to the App Store. Until then CTAs collect emails for early access |
| `PUBLIC_PLAY_STORE_URL` | Adds the Google Play button |
| `PUBLIC_WAITLIST_ENDPOINT` | Where the email form POSTs `{email, sign, source, page}` (a Supabase edge function or a newsletter tool). **Not set yet: emails are not stored until it is** |
| `PUBLIC_POSTHOG_KEY` | Turns on PostHog. Events: `cta_clicked`, `sign_picked`, `waitlist_joined` |
| `SITE_URL` | The real domain (canonical links, sitemap, RSS) |

Deploy: Cloudflare Workers Builds, project `lunerituals`, auto-deploys on every push to `main`. Repo root, build `npm run build`, deploy `npx wrangler deploy` (wrangler.jsonc serves `dist/` and runs worker/index.js for `/api/waitlist`). Domain lunerituals.app. Secret `RESEND_API_KEY` lives only in the Cloudflare dashboard.

## Why it is built this way (what converts in this category)

- **The product working above the fold.** Co-Star and The Pattern sell a personal reading, not features. Here the hero is the reading itself: tonight's real moon, and one tap on your sign shows where it falls for you. Every pick is remembered and sent with the email.
- **One action, repeated.** One form, the same words everywhere, a sticky button on phones (Calm, Headspace).
- **Annual plan first.** The yearly plan is the middle card, marked "Save 50%", with the trial in plain words (Calm, Moonly).
- **Search pages that answer a daily question.** "Moon in Aries", "full moon in Taurus" are searched every month; each sign page ends in the same form. Moonly and astrology publishers grow this way.
- **Trust by honesty.** No invented reviews or user counts; "a mirror, never a prophecy", sources, and the care note.
