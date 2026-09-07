import { render } from '@solidjs/web';
import { flush } from 'solid-js';
import App from './App.jsx';
import { toEmpty, toFresh1k, updateNodeps, updateDeps, remove100 } from './ops.js';
import './fx.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let dispose = null;

// Solid 2.0 batches + flushes async, so `flush()` forces the DOM mutation AND
// the queued user effects (the __fx-counting createEffect phases) to complete
// synchronously inside the timed call, matching the other adapters.
const run = (fn) => {
	fn();
	flush();
};

window.__mount = () => {
	dispose = render(() => <App />, target);
	flush();
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
