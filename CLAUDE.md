# lune-site

The public site and journal for Lune: Moon Rituals, live at https://lunerituals.app. The app lives in its own repo (nayyymarques-eng/Lune). README.md has the pages, the journal template and the launch switches.

## Stack and commands

- Astro 5, TypeScript strict, static output. Plain CSS with the design-system tokens in `src/styles/tokens.css`. Node 22.
- `worker/index.js` (Cloudflare Worker) answers only `/api/waitlist` and saves emails to Workers KV `lune-site-waitlist`. No database.
- Install `npm ci` · dev `npm run dev` · moon data `npm run data` · build `npm run build`.
- Checks: `npm run build && npm run check:links && npm test` (Playwright in `tests/`; one file: `npm test -- tests/site.spec.ts`; one test: `-g "moon compass"`). No ESLint or Prettier.
- Deploy: Cloudflare Workers Builds on every merge to `main`. The "Workers Builds" check always fails on branches; that is expected.

## Done means

1. `npm run build`, `npm run check:links` and `npm test` pass.
2. You looked at full-page screenshots at 1440 and 390 of every page you changed.
3. Branch + PR, merged only with "Build and secrets" and "Site checks" green. Never push to `main`, never `--no-verify`, never skip or weaken a test to get green.

## Rules

- The hero layout is final: do not touch it.
- Style only from the app (glass, lights, colours), always dark. Lights come from the single renderer (`public/lune-light.js`, `canvas[data-light]`). Astro CSS is scoped: elements made by JS need `:global()`.
- The site sells only the download (email waitlist). No prices anywhere.
- Copy (English): practice first, astrology as reflection. Never "15 minutes" or "quick". Many ways to believe, each one full; never measure belief. Never mention religion. Never reduce the altar to "candle and water". Never promise results. Kinship rule for traditions; no Jewish traditions; sources for every study.
- Journal: full articles on search-validated topics; never one line per sign. See README, "Writing a journal post".
- Secrets only in the Cloudflare dashboard (e.g. `RESEND_API_KEY`). Non-secret vars go in `wrangler.jsonc` (deploy overwrites dashboard vars).
- Privacy: moon compass birth data stays in the browser; only the city name goes to Open-Meteo; analytics never gets birth data.
- Whoever removes something removes the code, styles, tests and texts only it used, in the same PR.
