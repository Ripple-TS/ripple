// Entry matches the official krausest vue-vapor fixture (createVaporApp +
// mount), with one suite-specific addition: the __benchFlush hook below.
import { createVaporApp, nextTick } from 'vue';
import App from './App.vue';

createVaporApp(App).mount('#app');

// Vue commits on a microtask (queueJob → flushJobs), and unlike react/ripple
// (flushSync) or solid (flush()) it exposes no public synchronous flush. The
// harnesses (../run.mjs, ../run-reorder.mjs) detect this hook and extend each
// timed click window until the returned promise resolves — nextTick() settles
// after flushJobs completes, i.e. after the DOM mutation for the click has
// landed. The extra microtask hop is Vue's own scheduling cost, so it belongs
// inside the measurement.
window.__benchFlush = () => nextTick();
