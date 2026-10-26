import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
export async function GET(context) {
  const posts = await getCollection('journal', (p) => !p.data.draft);
  return rss({
    title: 'Lune Journal', description: 'Notes for each moon.', site: context.site,
    items: posts.map((p) => ({ title: p.data.title, description: p.data.description, pubDate: p.data.date, link: `/journal/${p.id}` })),
  });
}
