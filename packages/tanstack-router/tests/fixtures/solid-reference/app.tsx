import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import * as api from '@tanstack/solid-router';
import { scenario } from '../../differential/scenario.js';
export function start(target: HTMLElement) {
	const app = scenario(api, {
		layout: () => {
			const [count, set] = createSignal(0);
			return (
				<main>
					<button onClick={() => set(count() + 1)}>Count {count()}</button>
					<api.Outlet />
				</main>
			);
		},
		page: (route: any, renders: string[]) => {
			const data = route.useLoaderData();
			renders.push(route.id);
			return <p>{data()}</p>;
		},
	});
	const dispose = render(() => <api.RouterProvider router={app.router} />, target);
	return { ...app, dispose };
}
