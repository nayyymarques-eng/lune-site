import { defineConfig } from '@playwright/test';

// Site checks on the built site (npm run build first). Chromium only, desktop 1440 and phone 390.
export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: 'http://127.0.0.1:4321', browserName: 'chromium', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4321', url: 'http://127.0.0.1:4321', reuseExistingServer: !process.env.CI },
});
