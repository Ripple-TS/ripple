import { hydrate } from 'ripple';
import { App } from './App.tsrx';

const container = document.getElementById('app');
if (!container) throw new Error('Missing #app root in index.html');

// Hydration is DEFERRED behind window.__hydrate so the Playwright harness can
// time it in isolation (the page loads with the server DOM already in place).
// Ripple's `hydrate(component, { target, props })` adopts the server DOM by
// walking from the HYDRATION_START marker the server emitted around the body.
// It commits synchronously, so the harness's synchronous timer captures the work.
(window as any).__hydrate = () => hydrate(App, { target: container, props: {} });
(window as any).__ready = true;
