import { mount } from 'ripple';
import App from './Main.tsrx';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
mount(App, { target });
