// Entry mirrors the sibling vue-vapor fixtures: createVaporApp + __benchFlush
// (vue commits on a microtask with no public sync flush; the harness awaits
// this after every pump/interaction).
import { createVaporApp, nextTick } from 'vue';
import App from './App.vue';

createVaporApp(App).mount('#app');

window.__benchFlush = () => nextTick();
