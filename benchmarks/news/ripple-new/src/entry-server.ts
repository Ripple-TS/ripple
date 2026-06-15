import { render } from 'ripple-new/server';
import { App } from './App.tsrx';

// SSR entry. The harness loads this via ssrLoadModule and times renderApp().
export async function renderApp(): Promise<{ head: string; body: string; css: string }> {
	const { head, body, css } = await render(App);
	return { head, body, css };
}
