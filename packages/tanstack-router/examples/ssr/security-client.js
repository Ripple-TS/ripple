import { hydrate, mount } from 'ripple';
import { setTrustedTypesPolicy } from 'ripple/csp';
import './security-hmr.css';
import { status } from './security-hmr.js';
document.documentElement.dataset.hmrModule = status;
import { SecurityApp, SecurityError } from './security-app.tsrx';

setTrustedTypesPolicy(window.__RIPPLE_TRUSTED_TYPES__ ?? null);
export let dispose = (document.documentElement.dataset.csr ? mount : hydrate)(SecurityApp, {
	target: document.getElementById('app'),
	rootBoundary: { catch: SecurityError },
});
document.documentElement.dataset.hydrated = 'true';
if (import.meta.hot) {
	import.meta.hot.accept();
	import.meta.hot.dispose(() => dispose());
}
