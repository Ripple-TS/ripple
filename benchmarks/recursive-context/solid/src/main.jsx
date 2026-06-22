import { render } from '@solidjs/web';
import { flush } from 'solid-js';
import App, { bumpRoot, bumpPartial, hideMid, showMid } from './App.jsx';

const target = document.getElementById('main');
let dispose = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
window.__mount = () => {
	dispose = render(() => <App depth={10} />, target);
};
// Solid 2.0 batches updates and flushes asynchronously, so `flush()` forces the
// DOM mutation to complete synchronously — matching the other adapters'
// `flushSync`, so each op's work is fully captured inside the timed call.
window.__updateRoot = () => {
	bumpRoot();
	flush();
};
window.__updatePartial = () => {
	bumpPartial();
	flush();
};
// Partial unmount/remount of the Mid subtree.
window.__partialUnmount = () => {
	hideMid();
	flush();
};
window.__partialRemount = () => {
	showMid();
	flush();
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
