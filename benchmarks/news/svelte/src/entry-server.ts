import { render } from 'svelte/server';
import App from './App.svelte';

export async function renderApp(): Promise<{ head: string; body: string; css: string }> {
	const { body, head } = render(App);
	return { body, head, css: '' };
}
