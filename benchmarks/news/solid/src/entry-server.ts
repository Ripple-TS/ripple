import { renderToString, generateHydrationScript } from '@solidjs/web';
import { App } from './App.tsrx';

// SSR entry — the harness loads this via ssrLoadModule and times renderApp().
// `renderToString` produces hydration-keyed HTML (vite-plugin-solid compiled
// this module with `generate: 'ssr', hydratable: true`); `generateHydrationScript`
// emits the `_$HY` runtime the client needs, which goes in <head>. Shape
// (`{ head, body, css }`) matches the other entries so one harness drives all.
export async function renderApp(): Promise<{ head: string; body: string; css: string }> {
	const body = renderToString(() => App());
	const head = generateHydrationScript();
	return { head, body, css: '' };
}
