import fs from 'node:fs';

// Every page Google sees: read from the built sitemap, so new pages are checked without editing the tests.
export const PAGES = [...fs.readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');

// Legal texts are the lawyer's words, so the copy rules below apply only to the marketing pages.
export const LEGAL = ['/care', '/delete-account', '/privacy', '/support', '/terms'];

// Nayara's copy rules (26 Oct 2026). Each one is a sentence that must never reach a visitor.
export const FORBIDDEN: [RegExp, string][] = [
  [/\$\s?\d|€\s?\d|\d\s?(USD|EUR)\b|per month|per year|\/mo\b|\/yr\b/i, 'a price (the site sells only the download)'],
  [/\b(15|fifteen)[- ]min/i, '"15 minutes" (meaning over speed)'],
  [/candle and (a )?(glass of )?water/i, '"candle and water" (the altar has many objects)'],
  [/how much to believe|how deep(ly)? you believe/i, 'measuring belief (many ways to believe)'],
  [/religio/i, 'religion (never mentioned)'],
];
