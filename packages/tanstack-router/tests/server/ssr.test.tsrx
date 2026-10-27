import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	Scripts,
	createControlledPromise,
	createRootRoute,
	createRouter,
	RouterProvider,
	lazyRouteComponent,
} from '@ripple-ts/tanstack-router';
import {
	createRequestHandler,
	renderRouterToString,
	renderRouterToStream,
} from '@ripple-ts/tanstack-router/ssr/server';
import { makeSsrRouter } from '../fixtures/consumer/router.tsrx';
import { render } from 'ripple/server';

afterEach(() => vi.restoreAllMocks());

for (const mode of ['buffered', 'stream'] as const) {
	const handler =
		mode === 'buffered' ? renderRouterToString : renderRouterToStream;
	describe(mode, () => {
		it(
			'isolates requests, loads once, and transfers loader data and deduplicated head assets',
			async () => {
				const routers: any[] = [];
				const loads = vi.fn();
				const responses = await Promise.all(
					['alice', 'bob'].map(
						(value) => createRequestHandler({
							request: new Request('http://localhost/'),
							createRouter: () => {
								const router = makeSsrRouter({ value, onLoad: loads });
								routers.push(router);
								return router;
							},
						})(handler),
					),
				);
				const bodies = await Promise.all(responses.map((r) => r.text()));
				expect(loads).toHaveBeenCalledTimes(2);
				for (const [index, html] of bodies.entries()) {
					expect(html).toContain(index ? 'bob' : 'alice');
					expect(html).not.toContain(index ? 'alice' : 'bob');
					expect(html.match(/<!doctype html>/gi)).toHaveLength(1);
					expect(html).toContain('Home title');
					expect(html).not.toContain('Root title');
					expect(html.match(/name="description"/g)).toHaveLength(1);
					expect(html).toContain('$_TSR');
					expect(routers[index].serverSsr).toBeUndefined();
					expect(routers[index].history.subscribers.size).toBe(0);
				}
			},
		);

		it.each(
			[
				['/error', 500, 'Loader failed'],
				['/not-found', 404, 'Missing page'],
				['/missing', 404, 'Missing page'],
			] as const,
		)('returns %s with status %s', async (path, status, message) => {
			const response = await createRequestHandler({
				request: new Request(`http://localhost${path}`),
				createRouter: () => makeSsrRouter({ path }),
			})(handler);
			expect(response.status).toBe(status);
			expect(await response.text()).toContain(message);
		});

		it('returns redirects without rendering and clears SSR ownership', async () => {
			const router = makeSsrRouter();
			const renderSpy = vi.fn(handler);
			const response = await createRequestHandler({
				request: new Request('http://localhost/redirect'),
				createRouter: () => router,
			})(renderSpy);
			expect(response.status).toBe(307);
			expect(response.headers.get('location')).toBe('/next');
			expect(renderSpy).not.toHaveBeenCalled();
			expect(router.serverSsr).toBeUndefined();
		});

		it('renders data-only routes as pending without evaluating their components', async () => {
			const response = await createRequestHandler({
				request: new Request('http://localhost/'),
				createRouter: () => makeSsrRouter({ ssr: 'data-only' }),
			})(handler);
			const html = await response.text();
			expect(html).toContain('Pending home');
			expect(html).not.toContain('<h1>');
		});
	});
}

it('rejects reused router instances', async () => {
	const router = makeSsrRouter();
	const request = new Request('http://localhost/');
	await createRequestHandler({ request, createRouter: () => router })(renderRouterToString);
	await expect(
		createRequestHandler({ request, createRouter: () => router })(renderRouterToString),
	).rejects.toThrow('fresh router');
});

it(
	'streams a shell before deferred data, then emits complete UI and transport records',
	async () => {
		const deferred = createControlledPromise<string>();
		const router = makeSsrRouter({ deferred });
		const response = await createRequestHandler({
			request: new Request('http://localhost/'),
			createRouter: () => router,
		})(renderRouterToStream);
		const reader = response.body!.getReader();
		const decoder = new TextDecoder();
		let html = decoder.decode((await reader.read()).value);
		expect(html).toContain('Waiting for data');
		expect(html).not.toContain('late-value');
		deferred.resolve('late-value');
		for (;;) {
			const { value, done } = await reader.read();
			if (done) break;
			html += decoder.decode(value);
		}
		expect(html).toContain('late-value');
		expect(html).toContain('data-deferred');
		expect(html.endsWith('</body></html>')).toBe(true);
		expect(router.serverSsr).toBeUndefined();
	},
);

it('aborts loader work and never starts rendering an already-aborted request', async () => {
	const controller = new AbortController();
	controller.abort(new Error('gone'));
	const create = vi.fn(() => makeSsrRouter());
	await expect(
		createRequestHandler({
			request: new Request('http://localhost/', { signal: controller.signal }),
			createRouter: create,
		})(renderRouterToStream),
	).rejects.toThrow('gone');
	expect(create).not.toHaveBeenCalled();
});

it.each(['request', 'consumer'])(
	'cancels a live stream through %s and ignores late loader data',
	async (source) => {
		const deferred = createControlledPromise<string>();
		const controller = new AbortController();
		const router = makeSsrRouter({ deferred });
		const response = await createRequestHandler({
			request: new Request('http://localhost/', { signal: controller.signal }),
			createRouter: () => router,
		})(renderRouterToStream);
		const reader = response.body!.getReader();
		await reader.read();
		if (source === 'request') {
			controller.abort(new Error('disconnected'));
			await expect(reader.read()).rejects.toThrow('disconnected');
		} else await reader.cancel('disconnected');
		expect(router.serverSsr).toBeUndefined();
		deferred.resolve('late after cancellation');
		await Promise.resolve();
	},
);

it('reuses successful server component preloads and retries failures', async () => {
	const importer = vi.fn().mockRejectedValueOnce(new Error('retry')).mockResolvedValue({
		default: () => <p>Lazy ready</p>,
	});
	const Lazy = lazyRouteComponent(importer);
	await Lazy.preload!();
	await Lazy.preload!();
	await Lazy.preload!();
	const first = await render(Lazy);
	const second = await render(Lazy);
	expect(first.body).toContain('Lazy ready');
	expect(second.body).toContain('Lazy ready');
	expect(importer).toHaveBeenCalledTimes(2);
});

it.each(['buffered', 'stream'])('renders lazy error boundaries during %s rendering', async (
	mode,
) => {
	const LazyError = lazyRouteComponent(
		async () => ({ default: ({ error }: any) => <p data-error>{error.message}</p> }),
	);
	const request = new Request('http://localhost/');
	const router = createRouter({
		routeTree: createRootRoute({
			component: () => {
				throw new Error('render boom');
			},
			errorComponent: LazyError,
		}),
	});
	const response = await createRequestHandler({ request, createRouter: () => router })(
		mode === 'buffered' ? renderRouterToString : renderRouterToStream,
	);
	const html = await response.text();
	expect(html).toContain('data-error');
	expect(html).toContain('render boom');
	expect(router.serverSsr).toBeUndefined();
});

it('cleans up SSR state after a synchronous rendering failure', async () => {
	const log = vi.spyOn(console, 'error').mockImplementation(() => {});
	const router = makeSsrRouter();
	const request = new Request('http://localhost/');
	const response = await createRequestHandler({ request, createRouter: () => router })(
		(options) => renderRouterToString({
			...options,
			children: () => {
				throw new Error('render boom');
			},
		}),
	);
	expect(response.status).toBe(500);
	expect(router.serverSsr).toBeUndefined();
	expect(log).toHaveBeenCalled();
});

it.each([
	new Error('loader boom'),
	'loader boom',
	'',
	false,
	0,
	-0,
	0n,
	null,
	undefined,
	NaN,
	{ message: 'loader boom' },
])('preserves thrown SSR error values: %s', async (thrown) => {
	const onError = vi.fn();
	let received: unknown = Symbol();
	const router = createRouter({
		routeTree: createRootRoute({
			loader: () => {
				throw thrown;
			},
			onError,
			errorComponent: ({ error }) => {
				received = error;
				return <p data-error>Error</p>;
			},
		}),
	});
	const response = await createRequestHandler({
		request: new Request('http://localhost/'),
		createRouter: () => router,
	})(renderRouterToString);
	expect(response.status).toBe(500);
	expect(await response.text()).toContain('data-error');
	expect(received).toBe(thrown);
	expect(onError).toHaveBeenCalledWith(thrown);
});

it('merges response headers from the rendered route prefix', async () => {
	const router = createRouter({
		routeTree: createRootRoute({
			component: () => <p>Headers</p>,
			headers: () => ({ 'x-route': 'root', 'cache-control': 'private' }),
		}),
	});
	const response = await createRequestHandler({
		request: new Request('http://localhost/'),
		createRouter: () => router,
	})(renderRouterToString);
	expect(response.headers.get('x-route')).toBe('root');
	expect(response.headers.get('cache-control')).toBe('private');
	expect(response.headers.get('content-type')).toContain('text/html');
});

it(
	'fails an unread stream and releases pending component work on the core lifetime limit',
	async () => {
		const { trackAsync } = await import('ripple');
		const work = new AbortController();
		function Pending() @{
			const data = trackAsync(
				() => ({ promise: new Promise<string>(() => {}), abortController: work }),
			);
			<p>{data.value}</p>
		}
		const router = createRouter({ routeTree: createRootRoute({ component: Pending }) });
		vi.useFakeTimers();
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			const response = await createRequestHandler({
				request: new Request('http://localhost/'),
				createRouter: () => router,
			})(renderRouterToStream);
			await vi.advanceTimersByTimeAsync(120_000);
			expect(router.serverSsr).toBeUndefined();
			expect(work.signal.aborted).toBe(true);
			await expect(response.text()).rejects.toThrow('Stream lifetime exceeded');
		} finally {
			vi.useRealTimers();
			warn.mockRestore();
		}
	},
);

it('propagates fatal stream rendering failures and cleans up an unread response', async () => {
	vi.spyOn(console, 'error').mockImplementation(() => {});
	const router = makeSsrRouter();
	const response = await createRequestHandler({
		request: new Request('http://localhost/'),
		createRouter: () => router,
	})(
		(options) => renderRouterToStream({
			...options,
			children: () => {
				throw new Error('fatal shell');
			},
		}),
	);
	await expect(response.text()).rejects.toThrow('fatal shell');
	expect(router.serverSsr).toBeUndefined();
});

it('aborts a buffered render suspended on component work', async () => {
	const { trackAsync } = await import('ripple');
	const work = new AbortController();
	const requestController = new AbortController();
	const started = createControlledPromise<void>();
	function Pending() @{
		const data = trackAsync(() => {
			started.resolve();
			return { promise: new Promise<string>(() => {}), abortController: work };
		});
		<p>{data.value}</p>
	}
	const router = createRouter({ routeTree: createRootRoute({ component: Pending }) });
	const pending = createRequestHandler({
		request: new Request('http://localhost/', { signal: requestController.signal }),
		createRouter: () => router,
	})(renderRouterToString);
	await started;
	requestController.abort(new Error('abort buffered'));
	await expect(pending).rejects.toThrow('abort buffered');
	expect(work.signal.aborted).toBe(true);
	expect(router.serverSsr).toBeUndefined();
});

it('emits late router state at a record boundary while renderer work remains pending', async () => {
	const deferred = createControlledPromise<string>();
	const transport = createControlledPromise<string>();
	const router = makeSsrRouter({ deferred, transport });
	const response = await createRequestHandler({
		request: new Request('http://localhost/'),
		createRouter: () => router,
	})(renderRouterToStream);
	const reader = response.body!.getReader();
	const decoder = new TextDecoder();
	const shell = decoder.decode((await reader.read()).value);
	expect(shell).toContain('Waiting for data');
	transport.resolve('transport before UI');
	const record = decoder.decode((await reader.read()).value);
	expect(record).toContain('transport before UI');
	expect(record.startsWith('<script')).toBe(true);
	expect(record.endsWith('</script>')).toBe(true);
	expect(record).not.toContain('</body>');
	deferred.resolve('late UI');
	let tail = '';
	for (;;) {
		const chunk = await reader.read();
		if (chunk.done) break;
		tail += decoder.decode(chunk.value);
	}
	expect(tail).toContain('late UI');
	expect(tail.endsWith('</body></html>')).toBe(true);
});

it('catches request abort during synchronous renderer setup', async () => {
	const controller = new AbortController();
	const router = makeSsrRouter();
	await expect(
		createRequestHandler({
			request: new Request('http://localhost/', { signal: controller.signal }),
			createRouter: () => router,
		})(
			(options) => renderRouterToStream({
				...options,
				children: () => {
					controller.abort(new Error('setup abort'));
					return <p>Never sent</p>;
				},
			}),
		),
	).rejects.toThrow('setup abort');
	expect(router.serverSsr).toBeUndefined();
});

it('keeps root pending UI inside its shell while a component suspends', async () => {
	const { trackAsync } = await import('ripple');
	const gate = createControlledPromise<string>();
	function Pending() @{
		const value = trackAsync(() => gate);
		<p>{value.value}</p>
	}
	const root = createRootRoute({
		shellComponent: ({ children }) => <main data-shell>{children}</main>,
		component: Pending,
		pendingComponent: () => <p>Server root pending</p>,
	});
	const router = createRouter({ routeTree: root });
	const response = await createRequestHandler({
		request: new Request('http://localhost/'),
		createRouter: () => router,
	})(renderRouterToStream);
	const reader = response.body!.getReader();
	const shell = new TextDecoder().decode((await reader.read()).value);
	expect(shell).toMatch(/<main[^>]*data-shell/);
	expect(shell).toContain('Server root pending');
	gate.resolve('Root ready');
	let chunks = '';
	for (;;) {
		const next = await reader.read();
		if (next.done) break;
		chunks += new TextDecoder().decode(next.value);
	}
	expect(chunks).toContain('Root ready');
});

it(
	'serializes async/defer attributes and preserves external script order after bootstrap data',
	async () => {
		const root = createRootRoute({ component: () => <Scripts /> });
		const router = createRouter({ routeTree: root });
		const response = await createRequestHandler({
			request: new Request('http://localhost/'),
			createRouter: () => router,
			getRouterManifest: () => ({
				routes: {
					[root.id]: {
						scripts: [
							{ tag: 'script', attrs: { src: '/first.js', async: false, defer: true } },
							{ tag: 'script', attrs: { src: '/second.js', async: true, defer: false } },
						],
					},
				},
			}),
		})(renderRouterToString);
		const html = await response.text();
		expect(html.indexOf('$_TSR.router=')).toBeLessThan(html.indexOf('src="/first.js"'));
		expect(html.indexOf('src="/first.js"')).toBeLessThan(html.indexOf('src="/second.js"'));
		expect(html).toMatch(/src="\/first.js" defer=""/);
		expect(html).toMatch(/src="\/second.js" async=""/);
	},
);
