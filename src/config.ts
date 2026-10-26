// Launch switches. Before the app is in the stores, every CTA collects an email for early access.
// Once PUBLIC_APP_STORE_URL is set, the CTAs become "Start your 15-day free trial" and go to the store.
export const APP_STORE_URL = import.meta.env.PUBLIC_APP_STORE_URL || '';
export const PLAY_STORE_URL = import.meta.env.PUBLIC_PLAY_STORE_URL || '';
export const WAITLIST_ENDPOINT = import.meta.env.PUBLIC_WAITLIST_ENDPOINT || '/api/waitlist'; // POST {email, sign, source, page} as JSON (worker/index.js)
export const POSTHOG_KEY = import.meta.env.PUBLIC_POSTHOG_KEY || '';
export const LIVE = Boolean(APP_STORE_URL);
export const CTA = LIVE ? 'Start your 15-day free trial' : 'Get early access';
export const PRICE = { month: '$9.99', year: '$59.99', yearPerMonth: '$5.00', trialDays: 15 };
