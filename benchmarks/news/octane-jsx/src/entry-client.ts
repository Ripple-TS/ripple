import { hydrateRoot, flushSync } from 'octane';
import { App } from './App.tsx';

const container = document.getElementById('app');
if (!container) throw new Error('Missing #app root in index.html');

// Hydration is DEFERRED behind window.__hydrate so the Playwright harness can
// time it in isolation (the page loads with the server DOM already in place).
(window as any).__hydrate = () => {
	const root = hydrateRoot(container, App);
	flushSync(() => {}); // commit so "hydration time" includes the first commit
	return root;
};
(window as any).__ready = true;
