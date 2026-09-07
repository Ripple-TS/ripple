import { mount, flushSync } from 'ripple';
import App from './App.tsrx';
import { toEmpty, toFresh1k, updateNodeps, updateDeps, remove100 } from './ops.js';
import './fx.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let unmount = null;

// ripple's flushSync drains its scheduler — render blocks, ref effects, and
// user effect() blocks (incl. teardowns) — synchronously inside the timed
// call, matching the other adapters.
const run = (fn) => flushSync(fn);

window.__mount = () => {
	unmount = mount(App, { target });
	flushSync(() => {});
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
