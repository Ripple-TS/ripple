import { createRoot, flushSync } from 'octane';
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
} from './App.tsx';

const target = document.getElementById('main');
let root = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
window.__mount = () => {
	root = createRoot(target);
	root.render(App, {});
};
window.__unmount = () => {
	if (root) {
		root.unmount();
		root = null;
	}
};
window.__reset = () => {
	if (root) {
		root.unmount();
		root = null;
	}
	while (target.firstChild) target.removeChild(target.firstChild);
};
window.__bumpAt1 = () => flushSync(bumpAt1);
window.__bumpAt11 = () => flushSync(bumpAt11);
window.__bumpAt21 = () => flushSync(bumpAt21);
window.__bumpAt31 = () => flushSync(bumpAt31);
window.__bumpAt41 = () => flushSync(bumpAt41);
window.__bumpAt51 = () => flushSync(bumpAt51);
window.__bumpAt61 = () => flushSync(bumpAt61);
window.__bumpAt71 = () => flushSync(bumpAt71);
window.__bumpAt81 = () => flushSync(bumpAt81);
window.__bumpAt91 = () => flushSync(bumpAt91);
// Batched sweep: enqueue all 10 stateful bumps, then ONE synchronous flush — the
// framework's natural microtask coalescing, bounded synchronously so the harness
// times it without a frame wait. Contrast bump_sweep, which flushes per bump.
window.__sweepBatched = () =>
	flushSync(() => {
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
// Same batch, but queued DESCENDANT-first (deepest stateful node first). Tests
// whether the scheduler coalesces overlapping cascades regardless of update order.
window.__sweepBatchedReverse = () =>
	flushSync(() => {
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
