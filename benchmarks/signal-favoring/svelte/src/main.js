import { flushSync, mount, unmount } from 'svelte';
import App from './App.svelte';
import { bumpAt1 } from './C1.svelte';
import { bumpAt11 } from './C11.svelte';
import { bumpAt21 } from './C21.svelte';
import { bumpAt31 } from './C31.svelte';
import { bumpAt41 } from './C41.svelte';
import { bumpAt51 } from './C51.svelte';
import { bumpAt61 } from './C61.svelte';
import { bumpAt71 } from './C71.svelte';
import { bumpAt81 } from './C81.svelte';
import { bumpAt91 } from './C91.svelte';

const target = document.getElementById('main');
let app = null;
const entries = [
	[1, bumpAt1],
	[11, bumpAt11],
	[21, bumpAt21],
	[31, bumpAt31],
	[41, bumpAt41],
	[51, bumpAt51],
	[61, bumpAt61],
	[71, bumpAt71],
	[81, bumpAt81],
	[91, bumpAt91],
];
const bumps = entries.map(([, bump]) => bump);

window.__mount = () => {
	flushSync(() => {
		app = mount(App, { target });
	});
};
window.__unmount = () => {
	if (!app) return;
	const current = app;
	app = null;
	let result;
	flushSync(() => {
		result = unmount(current);
	});
	return result;
};
window.__reset = () => {
	if (app) {
		void unmount(app);
		app = null;
	}
	while (target.firstChild) target.removeChild(target.firstChild);
};
for (const [index, bump] of entries) {
	window['__bumpAt' + index] = () => flushSync(bump);
}
window.__sweepBatched = () =>
	flushSync(() => {
		for (const bump of bumps) bump();
	});
window.__sweepBatchedReverse = () =>
	flushSync(() => {
		for (let i = bumps.length - 1; i >= 0; i--) bumps[i]();
	});
window.__ready = true;
