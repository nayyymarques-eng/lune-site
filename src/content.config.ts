import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Journal posts: one markdown file per post in src/content/journal/. The Content role writes them.
const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(), // meta description and card text, about 150 characters
    date: z.coerce.date(),
    sign: z.enum(['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']).optional(),
    phase: z.string().optional(), // new_moon, full_moon, ...
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(), // path under /public
    draft: z.boolean().default(false),
  }),
});
const legal = defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/legal' }), schema: z.object({ title: z.string() }) });
export const collections = { journal, legal };
