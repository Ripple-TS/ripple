import { createRoot, flushSync } from 'octane';
import { ChatApp } from './Main.tsrx';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

createRoot(target).render(ChatApp);

// Commit scripted sends and tab switches inside the harness's timed interaction.
window.__benchFlush = () => flushSync(() => {});
