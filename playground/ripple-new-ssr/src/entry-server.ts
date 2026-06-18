import { render } from 'ripple-new/server';
import { App } from './App.tsrx';

// The SSR entry. server.js loads this through Vite's ssrLoadModule (so App.tsrx
// compiles in `mode: 'server'`) and calls renderApp() per request.
//
// `render()` is async (SSR Phase 4): it awaits any suspended use(promise) and
// re-renders, so `body` contains the resolved markup plus an inline data
// <script> with the serialized values for the client to seed. `css` is
// ready-to-place <style> tags for any scoped styles; `head` is currently empty.
export async function renderApp(): Promise<{ head: string; body: string; css: string }> {
	const { head, body, css } = await render(App);
	return { head, body, css };
}
