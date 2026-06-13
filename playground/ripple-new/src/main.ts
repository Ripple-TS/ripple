import { createRoot } from 'ripple-new';
import { App } from './App.tsrx';

const container = document.getElementById('app');
if (!container) throw new Error('Missing #app root in index.html');

const root = createRoot(container);
root.render(App);

// HMR: @tsrx/ripple-new emits stable hook symbols + a hmr() wrapper that
// preserves state across module swaps. Accept App.tsrx so editing the chrome
// component or its imports updates without losing the active demo selection.
if (import.meta.hot) {
	import.meta.hot.accept('./App.tsrx', (mod) => {
		if (mod?.App) root.render(mod.App);
	});
}
