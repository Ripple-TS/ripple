// Ported from TanStack/router; see NOTICE.
import { createLazyRoute } from '@ripple-ts/tanstack-router';
import HeavyComponent from './mockHeavyDependenciesRoute.tsrx';

export default function Route(id: string) {
	return createLazyRoute(id)({
		component: HeavyComponent,
	});
}
