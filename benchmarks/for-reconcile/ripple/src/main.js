import { mount, flushSync } from 'ripple';
import {
	DirectList,
	WrappedList,
	SingleList,
	SwitchList,
	reverse,
	shuffle,
	resetRand,
} from './App.tsrx';

const params = new URLSearchParams(location.search);
const N = parseInt(params.get('n') || '1000', 10);
const shape = params.get('shape') || 'direct';

const APPS = {
	direct: DirectList,
	wrapped: WrappedList,
	single: SingleList,
	switch: SwitchList,
};
const App = APPS[shape] || DirectList;

const target = document.getElementById('main');
let unmount = null;

window.__mount = () => {
	unmount = mount(App, { target, props: { n: N } });
};

window.__reverse = () => {
	flushSync(reverse);
};

window.__shuffle = () => {
	flushSync(shuffle);
};

window.__resetRand = () => {
	resetRand();
};

window.__reset = () => {
	if (unmount) {
		unmount();
		unmount = null;
	}
	while (target.firstChild) target.removeChild(target.firstChild);
};

window.__ready = true;
