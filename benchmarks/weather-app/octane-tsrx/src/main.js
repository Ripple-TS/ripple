import { createRoot } from 'octane';
import { App } from './App.tsrx';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

createRoot(target).render(App);
