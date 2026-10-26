// Adapted from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { trackAsync, type Component } from 'ripple';
import { isModuleNotFoundError } from '@tanstack/router-core';
import { isServer } from '@tanstack/router-core/isServer';

export function lazyRouteComponent(
	importer: () => Promise<Record<string, any>>,
	exportName = 'default',
) {
	let promise: Promise<void> | undefined;
	let component: Component<any> | undefined;
	let error: unknown;
	let failed = false;
	const load = () => {
		if (promise) return promise;
		error = undefined;
		failed = false;
		// Invoke synchronously, but normalize a synchronous importer failure too.
		try {
			promise = Promise.resolve(importer()).then((module) => {
				if (
					typeof module[exportName] !== 'function'
				) throw new Error(`lazyRouteComponent: export "${exportName}" not found`);
				component = module[exportName];
				if (!(isServer ?? typeof window === 'undefined')) Lazy.preload = undefined;
			}).catch((cause) => {
				error = cause;
				failed = true;
				promise = undefined;
			});
		} catch (cause) {
			error = cause;
			failed = true;
			return Promise.resolve();
		}
		return promise;
	};
	function Resolved(props: Record<string, any>) @{
		if (failed) {
			if (isModuleNotFoundError(error) && error instanceof Error && typeof window !== 'undefined') {
				try {
					const key = `tanstack_router_reload:${error.message}`;
					if (!sessionStorage.getItem(key)) {
						sessionStorage.setItem(key, '1');
						window.location.reload();
						return null;
					}
				} catch {
					/* An unavailable storage must not mask the import error. */
				}
			}
			throw error;
		}
		const Component = component!;
		<Component {...props} />
	}
	function Loading(props: Record<string, any>) @{
		const loaded = trackAsync(async () => {
			await load();
			return true;
		});
		@if (loaded.value) {
			<Resolved {...props} />
		}
	}
	function Lazy(props: Record<string, any>) {
		return component || failed ? <Resolved {...props} /> : <Loading {...props} />;
	}
	Lazy.preload = load as (() => Promise<void>) | undefined;
	return Lazy;
}
