import { render, get_css_for_hashes } from 'ripple/server';
import { App } from './App.tsrx';

// SSR entry — the harness loads this via the built bundle and times renderApp().
// Ripple's `render()` returns { head, body, css } where `css` is a Set of scoped
// stylesheet hashes; `get_css_for_hashes` resolves them to CSS text, wrapped in a
// <style> for the head. Shape ({ head, body, css }) matches the other targets so
// one harness drives them all. (The bench components are style-free, so css is empty.)
export async function renderApp(): Promise<{ head: string; body: string; css: string }> {
	const { head, body, css } = await render(App);
	const cssText = get_css_for_hashes(css);
	return { head, body, css: cssText ? `<style>${cssText}</style>` : '' };
}
