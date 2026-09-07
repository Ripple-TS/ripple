import { createElement, render } from 'preact';
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
let mounted = false;
const update = (run) => {
	run();
	return Promise.resolve();
};

window.__mount = () => {
	render(createElement(App), target);
	mounted = true;
};
window.__unmount = () => {
	if (mounted) {
		render(null, target);
		mounted = false;
	}
};
window.__reset = () => {
	if (mounted) {
		render(null, target);
		mounted = false;
	}
	while (target.firstChild) target.removeChild(target.firstChild);
};

const bumps = [
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
];
for (const [index, bump] of [
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
]) {
	window['__bumpAt' + index] = () => update(bump);
}
window.__sweepBatched = () =>
	update(() => {
		for (const bump of bumps) bump();
	});
window.__sweepBatchedReverse = () =>
	update(() => {
		for (let i = bumps.length - 1; i >= 0; i--) bumps[i]();
	});
window.__ready = true;
