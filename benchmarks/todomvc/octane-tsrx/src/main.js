import { createRoot, flushSync } from 'octane';
import { TodoApp } from './Main.tsrx';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

createRoot(target).render(TodoApp);

// Commit every scripted interaction before the harness dispatches the next one.
window.__benchFlush = () => flushSync(() => {});
