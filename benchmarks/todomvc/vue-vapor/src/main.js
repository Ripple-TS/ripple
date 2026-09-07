// Entry mirrors the js-framework vue-vapor fixture: createVaporApp + the
// __benchFlush hook. Vue commits on a microtask with no public synchronous
// flush; the harness detects this hook and extends each timed interaction
// window until the returned promise resolves (nextTick settles after
// flushJobs — the DOM mutation has landed). The scheduling hop is Vue's own
// cost, so it belongs inside the measurement.
import { createVaporApp, nextTick } from 'vue';
import App from './App.vue';

createVaporApp(App).mount('#app');

window.__benchFlush = () => nextTick();
