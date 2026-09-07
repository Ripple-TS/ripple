import { prerender } from 'octane/static';
import { App } from './App.tsrx';

// SSR entry / per-target adapter. The shared harness expects { head, body, css };
// octane's prerender returns { html, css } (head folded into html), so we map
// html → body and leave head empty (this app renders no <title>/<meta>).
export async function renderApp(): Promise<{ head: string; body: string; css: string }> {
	const { html, css } = await prerender(App);
	return { head: '', body: html, css };
}
