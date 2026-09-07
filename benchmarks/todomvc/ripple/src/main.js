import { mount } from 'ripple';
import TodoApp from './Main.tsrx';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');
mount(TodoApp, { target });
