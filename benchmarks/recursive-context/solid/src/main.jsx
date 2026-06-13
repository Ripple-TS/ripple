import { render } from '@solidjs/web';
import App, { bumpRoot, bumpPartial, hideMid, showMid } from './App.jsx';

const target = document.getElementById('main');
let dispose = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
window.__mount = () => {
	dispose = render(() => <App depth={10} />, target);
};
// Solid signal sets are synchronous; no flushSync wrapper needed. The harness
// still gates on rAF + setTimeout(0) so the paint cycle settles.
window.__updateRoot = () => {
	bumpRoot();
};
window.__updatePartial = () => {
	bumpPartial();
};
// Partial unmount/remount of the Mid subtree. Solid signal sets are sync;
// the harness's rAF + setTimeout gate ensures DOM mutations have settled.
window.__partialUnmount = () => {
	hideMid();
};
window.__partialRemount = () => {
	showMid();
};
window.__unmount = () => {
	if (dispose) {
		dispose();
		dispose = null;
	}
};
window.__reset = () => {
	if (dispose) {
		dispose();
		dispose = null;
	}
	while (target.firstChild) target.removeChild(target.firstChild);
};
window.__ready = true;
