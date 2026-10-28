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
title: "Full moon in Gemini, 24 November 2026: meaning and a ritual"
description: "About 150 characters for Google and the post card."
date: 2026-11-16
sign: gemini         # optional; the closing CTA then speaks to that sign
phase: full_moon     # optional; adds the "find it in your chart" link to the moon compass
tags: [full-moon]
keywords: [the searches this post answers]   # not shown on the page
faq:                 # optional; shown at the end and sent to Google as FAQPage
  - q: "A question people really search"
    a: "A full answer, two to four sentences."
cover: /journal/gemini-nov.webp   # optional, put the image in public/journal/
draft: false
---
```

**Each post is a full article on one topic.** Rules from Nayara (26 Oct 2026):

- **Topics come from search data.** Pick a query with measured volume (Keyword Planner CSVs in `/mnt/project-files/keyword-research/`) or real Google autocomplete, and use the questions people ask as headings and FAQ.
- **Depth over breadth.** A guide runs about 1,500 words: what it means, where it comes from (traditions, the sky), when, what you need, the ritual step by step, why it helps (sourced studies), and a FAQ. Four or more sections get a contents list automatically.
- **Never one line per sign.** A generalist post does not split into twelve short sign sections; nobody reads a whole post for one line about their sign. Cover the topic for everyone, and send people to their own reading: the moon compass (`/tonight`) for their house, `/moon/[sign]` for their sign. A sign gets its own post only when it is the whole topic (for example "new moon in Scorpio").
- **Practice first, astrology as reflection.** The ritual uses many altar items, never only a candle and water. Meaning over speed: never sell minutes or "quick". Many ways to believe, each one full; never measure belief, never mention religion.
- English, never promise results, kinship rule for traditions, no Jewish traditions, safety notes for any flame, sources for every study.

## Checks (every pull request)

GitHub Actions runs two checks, both must be green before a merge:

- **Build and secrets:** gitleaks, `npm ci`, the worker parses, `npm run build`, `npm audit` (shown).
- **site checks:** `npm run check:links` (no broken internal link) and `npm test` (Playwright, Chromium, desktop 1440 and phone 390). Every page in the sitemap answers, has one `h1` and a footer, has no script error and no sideways scroll, and keeps the copy rules (no price, no "15 minutes", no "candle and water", no measuring belief, no religion; legal pages excepted). The waitlist form and the moon compass are run end to end with the network mocked. Full-page pictures of the home, /moon, /tonight and /journal are kept as the `site-pictures` artifact of each run (screenshots of any failure too).

Locally: `npm run build && npm run check:links && npm test`. A new page is checked automatically once it is in the sitemap. A new copy rule goes in `tests/pages.ts`.

## Launch switches (environment variables)

| Variable | Effect |
|---|---|
| `PUBLIC_APP_STORE_URL` | When set, every CTA becomes "Start your 15-day free trial" and goes to the App Store. Until then CTAs collect emails for early access |
| `PUBLIC_PLAY_STORE_URL` | Adds the Google Play button |
| `PUBLIC_WAITLIST_ENDPOINT` | Where the email form POSTs `{email, sign, source, page}` (a Supabase edge function or a newsletter tool). **Not set yet: emails are not stored until it is** |
| `PUBLIC_POSTHOG_KEY` | Turns on PostHog. Events: `cta_clicked`, `sign_picked`, `waitlist_joined` |
| `SITE_URL` | The real domain (canonical links, sitemap, RSS) |

Deploy: Cloudflare Workers Builds, project `lune-site`, auto-deploys on every push to `main`. Repo root, build `npm run build`, deploy `npx wrangler deploy` (wrangler.jsonc serves `dist/` and runs worker/index.js for `/api/waitlist`). Domain lunerituals.app. Secret `RESEND_API_KEY` lives only in the Cloudflare dashboard.

## Why it is built this way (what converts in this category)

- **The product working above the fold.** Co-Star and The Pattern sell a personal reading, not features. Here the hero is the reading itself: tonight's real moon, and one tap on your sign shows where it falls for you. Every pick is remembered and sent with the email.
- **One action, repeated.** One form, the same words everywhere, a sticky button on phones (Calm, Headspace).
- **Annual plan first.** The yearly plan is the middle card, marked "Save 50%", with the trial in plain words (Calm, Moonly).
- **Search pages that answer a daily question.** "Moon in Aries", "full moon in Taurus" are searched every month; each sign page ends in the same form. Moonly and astrology publishers grow this way.
- **Trust by honesty.** No invented reviews or user counts; "a mirror, never a prophecy", sources, and the care note.
