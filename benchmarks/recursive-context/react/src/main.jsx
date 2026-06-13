import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { createElement } from 'react';
import App, { bumpRoot, bumpPartial, hideMid, showMid } from './App.jsx';

const target = document.getElementById('main');
let root = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
// NOT wrapping App in StrictMode keeps render counts apples-to-apples with the
// other adapters (StrictMode double-invokes in dev).
window.__mount = () => {
	root = createRoot(target);
	flushSync(() => root.render(createElement(App, { depth: 10 })));
};
window.__updateRoot = () => {
	flushSync(bumpRoot);
};
window.__updatePartial = () => {
	flushSync(bumpPartial);
};
window.__partialUnmount = () => {
	flushSync(hideMid);
};
window.__partialRemount = () => {
	flushSync(showMid);
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
window.__ready = true;
