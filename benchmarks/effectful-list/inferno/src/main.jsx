import { createComponentVNode, render, rerender } from 'inferno';
import App from './App.jsx';
import { toEmpty, toFresh1k, updateNodeps, updateDeps, remove100 } from './ops.js';
import './fx.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let mounted = false;

// rerender() drains Inferno's queued root work before the operation returns, so
// lifecycle work and unmount cleanups stay inside the timed window.
const run = (operation) => {
	operation();
	rerender();
};

window.__mount = () => {
	render(createComponentVNode(4, App), target);
	mounted = true;
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
