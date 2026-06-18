import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { hydrateRoot } from 'react-dom/client';
import { App } from './App.tsrx';

const container = document.getElementById('app');
if (!container) throw new Error('Missing #app root in index.html');

// Hydration is DEFERRED behind window.__hydrate so the Playwright harness can
// time it in isolation (the page loads with the server DOM already in place).
// `hydrateRoot` adopts the server-rendered DOM by matching structure.
//
// Wrapped in flushSync: hydrateRoot otherwise SCHEDULES hydration and returns
// immediately (concurrent), so the work would land outside the measured window
// and React would look ~instant. flushSync forces the hydration to commit
// synchronously, so the harness measures the actual work — apples-to-apples with
// ripple-new (which flushSync's) and Solid (synchronous hydrate).
(window as any).__hydrate = () => {
	let root: ReturnType<typeof hydrateRoot> | undefined;
	flushSync(() => {
		root = hydrateRoot(container, createElement(App));
	});
	return root;
};
(window as any).__ready = true;
