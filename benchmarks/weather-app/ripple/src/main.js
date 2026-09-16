import { mount } from 'ripple';
import { App } from './App.tsrx';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

mount(App, { rootBoundary: false, target });
