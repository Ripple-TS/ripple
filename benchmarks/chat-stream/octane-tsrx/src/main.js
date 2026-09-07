import { flushSync as flushBenchmark } from 'octane';
import { createRoot } from 'octane';
import { ChatApp } from './Main.tsrx';

const target = document.getElementById('main');
if (!target) throw new Error('missing #main root');

createRoot(target).render(ChatApp);

// Include the published runtime's queued DOM commit in event-driven samples.
window.__benchFlush = () => flushBenchmark(() => {});
