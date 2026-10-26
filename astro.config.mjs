import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static site. Set SITE_URL to the real domain before deploying.
export default defineConfig({
  site: process.env.SITE_URL || 'https://lunerituals.app',
  integrations: [sitemap()],
  trailingSlash: 'never',
  build: { format: 'directory', assets: 'assets' },
});
