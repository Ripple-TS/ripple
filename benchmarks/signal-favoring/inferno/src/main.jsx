import { render, rerender } from 'inferno';
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
const run = (operation) => {
	operation();
	rerender();
};

window.__mount = () => {
	render(<App />, target);
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
window.__bumpAt1 = () => run(bumpAt1);
window.__bumpAt11 = () => run(bumpAt11);
window.__bumpAt21 = () => run(bumpAt21);
window.__bumpAt31 = () => run(bumpAt31);
window.__bumpAt41 = () => run(bumpAt41);
window.__bumpAt51 = () => run(bumpAt51);
window.__bumpAt61 = () => run(bumpAt61);
window.__bumpAt71 = () => run(bumpAt71);
window.__bumpAt81 = () => run(bumpAt81);
window.__bumpAt91 = () => run(bumpAt91);
// Batched sweep: enqueue all 10 stateful bumps, then drain Inferno's root queue
// once. Contrast bump_sweep, which drains after every bump.
window.__sweepBatched = () =>
	run(() => {
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
	});
// Same batch queued DESCENDANT-first (deepest stateful node first).
window.__sweepBatchedReverse = () =>
	run(() => {
		bumpAt91();
		bumpAt81();
		bumpAt71();
		bumpAt61();
		bumpAt51();
		bumpAt41();
		bumpAt31();
		bumpAt21();
		bumpAt11();
		bumpAt1();
	});
window.__ready = true;
