import { render, rerender } from 'inferno';
import App from './App.jsx';
import * as ops from './ops.js';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
let mounted = false;
const run = (operation) => {
	operation();
	rerender();
};

// index.html does NOT auto-mount — harness wraps each call in performance.now().
// Inferno commits state synchronously; rerender() drains its queued root work
// before the operation returns so the harness measures the complete commit.
window.__hits = 0;
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
window.__openA = () => run(ops.openA);
window.__closeA = () => run(ops.closeA);
window.__openB = () => run(ops.openB);
window.__closeB = () => run(ops.closeB);
window.__openBS = () => run(ops.openBS);
window.__closeBS = () => run(ops.closeBS);
window.__openAll = () => run(ops.openAll);
window.__closeAll = () => run(ops.closeAll);
window.__rerenderA = () => run(ops.rerenderA);
window.__rerenderB = () => run(ops.rerenderB);
window.__rerenderBS = () => run(ops.rerenderBS);
window.__setDistinct = (on) => run(() => ops.setDistinct(on));
window.__ready = true;
