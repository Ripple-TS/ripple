import { mount } from 'ripple';
import ChatApp from './Main.tsrx';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
mount(ChatApp, { target });
