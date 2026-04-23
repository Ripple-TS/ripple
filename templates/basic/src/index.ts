import { mount } from 'ripple';
// @ts-expect-error: known issue, we're working on it
import { App } from './App.tsrx';

mount(App, {
	target: document.getElementById('root'),
});
