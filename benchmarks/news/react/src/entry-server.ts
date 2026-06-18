import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App.tsrx';

// SSR entry — the harness loads this via ssrLoadModule and times renderApp().
// React's `renderToString` matches the structure `hydrateRoot` expects on the
// client (no separate hydration script needed). Shape (`{ head, body, css }`)
// matches the other targets so one harness drives them all.
export async function renderApp(): Promise<{ head: string; body: string; css: string }> {
	const body = renderToString(createElement(App));
	return { head: '', body, css: '' };
}
