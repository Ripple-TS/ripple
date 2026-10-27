// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { createLazyRoute } from '@ripple-ts/tanstack-router';

export function Route(id: string) {
	return createLazyRoute(id)({
		component: () => <h1 data-testid="lazy-route-page">I'm a normal route</h1>,
	});
}
