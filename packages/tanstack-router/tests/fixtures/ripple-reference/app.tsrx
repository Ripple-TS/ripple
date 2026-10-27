import { track, mount, flushSync } from 'ripple';
import * as api from '@ripple-ts/tanstack-router';
import { scenario } from '../../differential/scenario.js';

export function start(target: HTMLElement) {
	const app = scenario(api, {
		layout: () => {
			const count = track(0);
			return <main>
				<button
					onClick={() => {
						count.value++;
					}}
				>
					{'Count ' + count.value}
				</button>
				<api.Outlet />
			</main>;
		},
		page: (route: any, renders: string[]) => {
			const data = route.useLoaderData();
			renders.push(route.id);
			return <p>{data.value}</p>;
		},
	});
	const dispose = mount(() => <api.RouterProvider router={app.router} />, { target });
	flushSync();
	return { ...app, dispose };
}
