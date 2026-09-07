import { createRoot, flushSync } from 'octane';
import Main from './Main.tsx';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

createRoot(target).render(Main);

// Keep each timed click's DOM commit inside the harness's measurement window.
window.__benchFlush = () => flushSync(() => {});
