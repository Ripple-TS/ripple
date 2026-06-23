import { hydrate } from '@solidjs/web';
import { App } from './App.tsrx';

const container = document.getElementById('app');
if (!container) throw new Error('Missing #app root in index.html');

// Hydration is DEFERRED behind window.__hydrate so the Playwright harness can
// time it in isolation (the page loads with the server DOM already in place).
// `@solidjs/web` `hydrate()` adopts that DOM via the hydration keys baked into
// both the SSR HTML and this client build. It runs synchronously (no flushSync
// needed).
(window as any).__hydrate = () => hydrate(() => App(), container);
(window as any).__ready = true;
