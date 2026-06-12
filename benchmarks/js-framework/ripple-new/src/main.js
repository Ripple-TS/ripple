import { createRoot } from 'ripple-new';
import Main from './Main.tsrx';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

createRoot(target).render(Main);
