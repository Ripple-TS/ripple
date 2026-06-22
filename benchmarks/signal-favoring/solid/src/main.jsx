import { render } from '@solidjs/web';
import { flush } from 'solid-js';
import App, {
	bumpAt1,
	bumpAt11,
	bumpAt21,
	bumpAt31,
	bumpAt41,
	bumpAt51,
	bumpAt61,
	bumpAt71,
	bumpAt81,
	bumpAt91,
} from './App.jsx';

const target = document.getElementById('main');
let dispose = null;

window.__mount = () => {
	dispose = render(() => <App />, target);
};
window.__unmount = () => {
	if (dispose) {
		dispose();
		dispose = null;
	}
};
window.__reset = () => {
	if (dispose) {
		dispose();
		dispose = null;
	}
	while (target.firstChild) target.removeChild(target.firstChild);
};
// Solid 2.0 batches updates and flushes asynchronously; flush() forces the DOM
// mutation to complete synchronously so the harness can time it inside the call
// (matching the other adapters' flushSync). Without it the setter returns before
// the update lands and the op would read as an unfairly tiny ~0ms.
window.__bumpAt1 = () => {
	bumpAt1();
	flush();
};
window.__bumpAt11 = () => {
	bumpAt11();
	flush();
};
window.__bumpAt21 = () => {
	bumpAt21();
	flush();
};
window.__bumpAt31 = () => {
	bumpAt31();
	flush();
};
window.__bumpAt41 = () => {
	bumpAt41();
	flush();
};
window.__bumpAt51 = () => {
	bumpAt51();
	flush();
};
window.__bumpAt61 = () => {
	bumpAt61();
	flush();
};
window.__bumpAt71 = () => {
	bumpAt71();
	flush();
};
window.__bumpAt81 = () => {
	bumpAt81();
	flush();
};
window.__bumpAt91 = () => {
	bumpAt91();
	flush();
};
// Batched sweep: enqueue all 10 stateful bumps, then ONE flush() — Solid's natural
// microtask coalescing, bounded synchronously. Contrast bump_sweep (flush per bump).
window.__sweepBatched = () => {
	bumpAt1();
	bumpAt11();
	bumpAt21();
	bumpAt31();
	bumpAt41();
	bumpAt51();
	bumpAt61();
	bumpAt71();
	bumpAt81();
	bumpAt91();
	flush();
};
window.__ready = true;
