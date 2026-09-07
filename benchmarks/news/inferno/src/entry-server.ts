import { renderToString } from 'inferno-server';
import { createElement } from 'inferno-create-element';
import { App } from './App.jsx';

export async function renderApp(): Promise<{ head: string; body: string; css: string }> {
	return { head: '', body: renderToString(createElement(App)), css: '' };
}
