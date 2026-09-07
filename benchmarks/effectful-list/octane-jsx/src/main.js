import { createRoot, flushSync, drainPassiveEffects } from 'octane';
import App from './App.tsx';
import { toEmpty, toFresh1k, updateNodeps, updateDeps, remove100 } from './ops.js';
import './fx.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let root = null;

// See octane-tsrx/src/main.js — passives are drained explicitly inside every
// op so the timed window matches React 19's sync-lane passive flush and the
// __fx gates settle deterministically.
const run = (fn) => {
	flushSync(fn);
	drainPassiveEffects();
};

window.__mount = () => {
	root = createRoot(target);
	root.render(App);
	drainPassiveEffects();
};

window.__toEmpty = () => run(toEmpty);
window.__toFresh1k = () => run(toFresh1k);

window.__opMount1k = () => run(toFresh1k);
window.__opUpdateNodeps = () => run(updateNodeps);
window.__opUpdateDeps = () => run(updateDeps);
window.__opClear = () => run(toEmpty);
window.__opRemount = () => run(toFresh1k);
window.__opRemove100 = () => run(remove100);

window.__ready = true;
