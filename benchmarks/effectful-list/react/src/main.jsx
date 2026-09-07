import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { createElement } from 'react';
import App from './App.jsx';
import { toEmpty, toFresh1k, updateNodeps, updateDeps, remove100 } from './ops.js';
import './fx.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let root = null;

// React 19 flushes PASSIVE effects synchronously at the tail of a sync-lane
// commit (see react-dom-client: `pendingEffectsLanes & SyncLanes &&
// flushPendingEffects()`), and flushSync commits at discrete/sync priority —
// so a flushSync-wrapped op includes useEffect dispatch AND unmount cleanups
// in the timed window, matching the octane fixtures' explicit
// drainPassiveEffects(). No StrictMode: double-invoking would skew the __fx
// counters and render counts vs the other adapters.
const run = (fn) => flushSync(fn);

window.__mount = () => {
	root = createRoot(target);
	flushSync(() => root.render(createElement(App)));
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
