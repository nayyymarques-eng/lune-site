import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Journal posts: one markdown file per post in src/content/journal/. The Content role writes them.
// Every post is a full article on ONE search-validated topic (README, "Writing a journal post").
const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(), // meta description and card text, about 150 characters
    date: z.coerce.date(),
    sign: z.enum(['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']).optional(),
    phase: z.string().optional(), // new_moon, full_moon, ...
    tags: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
    cover: z.string().optional(), // path under /public
    draft: z.boolean().default(false),
    // Questions people really search, answered in full. Rendered at the end of the post and as FAQPage schema.
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});
const legal = defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/legal' }), schema: z.object({ title: z.string() }) });
export const collections = { journal, legal };
