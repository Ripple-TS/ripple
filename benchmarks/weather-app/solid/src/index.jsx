import { render } from '@solidjs/web';
import App from './App.jsx';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

render(() => <App />, target);
