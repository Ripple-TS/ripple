import { render } from '@solidjs/web';
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
} from './App.jsx';

const target = document.getElementById('main');
let dispose = null;

window.__mount = () => {
	dispose = render(() => <App />, target);
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
window.__bumpAt1 = () => bumpAt1();
window.__bumpAt11 = () => bumpAt11();
window.__bumpAt21 = () => bumpAt21();
window.__bumpAt31 = () => bumpAt31();
window.__bumpAt41 = () => bumpAt41();
window.__bumpAt51 = () => bumpAt51();
window.__bumpAt61 = () => bumpAt61();
window.__bumpAt71 = () => bumpAt71();
window.__bumpAt81 = () => bumpAt81();
window.__bumpAt91 = () => bumpAt91();
window.__ready = true;
