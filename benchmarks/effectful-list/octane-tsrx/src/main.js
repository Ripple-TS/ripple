import { createRoot, flushSync, drainPassiveEffects } from 'octane';
import App from './App.tsrx';
import { toEmpty, toFresh1k, updateNodeps, updateDeps, remove100 } from './ops.js';
import './fx.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let root = null;

// Timed-window note: React 19 flushes passive effects SYNCHRONOUSLY at the
// tail of a sync-lane commit, so the react fixture's flushSync ops include
// useEffect dispatch in the timed window. Octane's flushSync intentionally
// defers passives to the post-paint scheduler — so every op here drains them
// explicitly (public drainPassiveEffects) to keep the timed window comparable
// AND to make the __fx correctness gates deterministic.
const run = (fn) => {
	flushSync(fn);
	drainPassiveEffects();
};

// index.html does NOT auto-mount; the harness calls __mount() once (untimed).
window.__mount = () => {
	root = createRoot(target);
	root.render(App);
	drainPassiveEffects();
};

// Untimed state-reset helpers (harness `pre` steps) — same functions as the
// ops, exposed under distinct names so the harness code reads clearly.
window.__toEmpty = () => run(toEmpty);
window.__toFresh1k = () => run(toFresh1k);

// Timed ops.
window.__opMount1k = () => run(toFresh1k);
window.__opUpdateNodeps = () => run(updateNodeps);
window.__opUpdateDeps = () => run(updateDeps);
window.__opClear = () => run(toEmpty);
window.__opRemount = () => run(toFresh1k);
window.__opRemove100 = () => run(remove100);

window.__ready = true;
