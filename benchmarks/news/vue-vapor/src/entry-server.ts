import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import App from './App.vue';

// SSR entry — the harness loads the built bundle and times renderApp(). On
// the server a vapor SFC compiles to the regular ssrRender codegen (vapor has
// no server string codegen in 3.6), so this is the standard createSSRApp +
// renderToString path; the vapor part happens on the client, where
// createVaporSSRApp() adopts this exact markup. Shape (`{ head, body, css }`)
// matches the other targets so one harness drives them all.
export async function renderApp(): Promise<{ head: string; body: string; css: string }> {
	const body = await renderToString(createSSRApp(App));
	return { head: '', body, css: '' };
}
