import { createVaporSSRApp } from 'vue';
import App from './App.vue';

const container = document.getElementById('app');
if (!container) throw new Error('Missing #app root in index.html');

// Hydration is DEFERRED behind window.__hydrate so the Playwright harness can
// time it in isolation (the page loads with the server DOM already in place).
// createVaporSSRApp().mount() adopts the server-rendered DOM synchronously —
// vapor hydration claims the existing nodes instead of creating them — so the
// timed window captures the actual hydration work (no flushSync wrapper
// needed; apples-to-apples with octane's flushSync and Solid's synchronous
// hydrate).
(window as any).__hydrate = () => {
	const app = createVaporSSRApp(App);
	app.mount(container);
	return app;
};
(window as any).__ready = true;
