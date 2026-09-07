import { createElement } from 'preact';
import { renderToString } from 'preact-render-to-string';
import { App } from './App.jsx';

export async function renderApp(): Promise<{ head: string; body: string; css: string }> {
	return { head: '', body: renderToString(createElement(App)), css: '' };
}
