import { createElement, render } from 'preact';
import App from './App.jsx';
import './fx.js';
import { remove100, toEmpty, toFresh1k, updateDeps, updateNodeps } from './ops.js';
import { waitForPassiveEffects } from './passive.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let mounted = false;

// Preact intentionally schedules passive effects after paint. The App-level
// post-commit sentinel resolves after the row effects queued by the same
// commit, so each adapter promise includes Preact's native passive-effect
// scheduling and cleanup work without reaching into scheduler internals.
const run = (fn) => {
	const settled = waitForPassiveEffects();
	fn();
	return settled;
};

window.__mount = () => {
	render(createElement(App), target);
	mounted = true;
};

window.__toEmpty = () => run(toEmpty);
window.__toFresh1k = () => run(toFresh1k);

window.__opMount1k = () => run(toFresh1k);
window.__opUpdateNodeps = () => run(updateNodeps);
window.__opUpdateDeps = () => run(updateDeps);
window.__opClear = () => run(toEmpty);
window.__opRemount = () => run(toFresh1k);
window.__opRemove100 = () => run(remove100);

window.__unmount = () => {
	if (mounted) {
		render(null, target);
		mounted = false;
	}
};
window.__ready = true;
