import { RouterProvider } from '../RouterProvider.tsrx';
import type { AnyRouter } from '@tanstack/router-core';

export function routerComponent(router: AnyRouter) {
	return function RouterRoot() {
		return <RouterProvider {router} />;
	};
}
