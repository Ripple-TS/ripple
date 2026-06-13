import { createRoot, flushSync } from 'ripple-new';
import App, {
	bumpAt1,
	bumpAt11,
	bumpAt21,
	bumpAt31,
	bumpAt41,
	bumpAt51,
	bumpAt61,
	bumpAt71,
	bumpAt81,
	bumpAt91,
} from './App.tsrx';

const target = document.getElementById('main');
let root = null;

// index.html does NOT auto-mount — harness wraps each call in performance.now().
window.__mount = () => {
	root = createRoot(target);
	root.render(App, {});
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
window.__bumpAt1 = () => flushSync(bumpAt1);
window.__bumpAt11 = () => flushSync(bumpAt11);
window.__bumpAt21 = () => flushSync(bumpAt21);
window.__bumpAt31 = () => flushSync(bumpAt31);
window.__bumpAt41 = () => flushSync(bumpAt41);
window.__bumpAt51 = () => flushSync(bumpAt51);
window.__bumpAt61 = () => flushSync(bumpAt61);
window.__bumpAt71 = () => flushSync(bumpAt71);
window.__bumpAt81 = () => flushSync(bumpAt81);
window.__bumpAt91 = () => flushSync(bumpAt91);
window.__ready = true;
