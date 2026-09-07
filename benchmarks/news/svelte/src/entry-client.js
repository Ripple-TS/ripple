import { flushSync, hydrate } from 'svelte';
import App from './App.svelte';

const container = document.getElementById('app');
if (!container) throw new Error('Missing #app root in index.html');

window.__hydrate = () => {
	let app;
	flushSync(() => {
		app = hydrate(App, { target: container, recover: false });
	});
	return app;
};
window.__ready = true;
