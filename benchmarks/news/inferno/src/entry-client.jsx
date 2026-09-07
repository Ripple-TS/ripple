import { hydrate } from 'inferno-hydrate';
import { App } from './App.jsx';

const container = document.getElementById('app');
if (!container) throw new Error('Missing #app root in index.html');

window.__hydrate = () => hydrate(<App />, container);
window.__ready = true;
