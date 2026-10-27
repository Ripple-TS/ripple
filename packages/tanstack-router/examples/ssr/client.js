import { mount } from 'ripple';
import { hydrateRouter } from '@ripple-ts/tanstack-router/ssr/client';
import { RouterProvider } from '@ripple-ts/tanstack-router';
import { getRouter } from './router.tsrx';
import './style.css';

export const router = getRouter(window.location.origin);
export let dispose = await hydrateRouter({ router, target: document.getElementById('app') });
// Let hosts and browser checks observe bootstrap without importing the entry.
document.documentElement.dataset.hydrated = 'true';

// A host removing this application must dispose its root. Remounting reuses the
// router's cache, but creates a new component scope and history subscription.
export function remount() {
	dispose();
	dispose = mount(RouterProvider, { target: document.getElementById('app'), props: { router } });
}
