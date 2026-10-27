import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdir, writeFile, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createRequire } from 'node:module';
import { chromium, firefox, webkit } from 'playwright';

const root = await realpath(
	process.argv[2]
		? resolve(process.argv[2])
		: fileURLToPath(new URL('../../examples/ssr/', import.meta.url)),
);
// Vite and compiler helpers resolve project configuration from the consumer.
process.chdir(root);
const { startServer } = await import(pathToFileURL(`${root}/serve.js`).href);
const { server, origin, entry } = await startServer(0);
const results = [];
const reportDir = fileURLToPath(new URL('../../dist/browser/', import.meta.url));
await mkdir(reportDir, { recursive: true });

async function ready(page) {
	await page.evaluate(async (entry) => {
		window.app = await import(entry);
	}, entry);
	await page.waitForFunction(() => window.app.router.state.status === 'idle');
}
async function visit(page, path = '/') {
	const response = await page.goto(`${origin}/app${path}`);
	await ready(page);
	return response;
}
async function navigate(page, options) {
	await page.evaluate((options) => window.app.router.navigate(options), {
		viewTransition: false,
		...options,
	});
}
async function heading(page, title) {
	await page.getByRole('heading', { name: title, exact: true }).waitFor();
}

try {
	// Report every emitted chunk, including lazy imports, and inspect actual module
	// ownership rather than searching minified output for framework names.
	const modules = JSON.parse(await readFile(`${root}/dist/client/modules.json`, 'utf8'));
	const ids = modules.flatMap((chunk) => chunk.modules);
	assert(!ids.some((id) => /node_modules\/(react|react-dom|solid-js|@solidjs)\//.test(id)));
	const runtimes = new Set(
		ids
			.filter((id) => /\/ripple\/src\/runtime\//.test(id))
			.map((id) => id.split('/ripple/src/runtime/')[0]),
	);
	assert.equal(runtimes.size, 1, 'exactly one Ripple runtime in the client graph');
	assert(ids.some((id) => id.endsWith('/ripple/src/runtime/index-client.js')));
	assert(!ids.some((id) => id.endsWith('/ripple/src/runtime/index-server.js')));
	const serverModules = JSON.parse(
		await readFile(`${root}/dist/server/modules.json`, 'utf8'),
	).flatMap((chunk) => chunk.modules);
	assert(serverModules.some((id) => id.endsWith('/ripple/src/runtime/index-server.js')));
	assert(!serverModules.some((id) => id.endsWith('/ripple/src/runtime/index-client.js')));
	const chunks = await Promise.all(
		modules.map(async (chunk) => {
			const source = await readFile(`${root}/dist/client/${chunk.file}`);
			return { file: chunk.file, bytes: source.length, gzip: gzipSync(source).length };
		}),
	);
	const gzip = chunks.reduce((sum, chunk) => sum + chunk.gzip, 0);
	assert(gzip < 80_000, `example JS budget: ${gzip} gzip bytes exceeds 80,000`);
	assert(
		chunks.some((chunk) => chunk.file.includes('/lazy-')),
		'explicit lazy import must stay split',
	);
	results.push({ bundle: { chunks, gzip, budget: 80_000, rippleRuntimes: runtimes.size } });

	await test(
		'installed dependency optimizer serves working TSRX navigation',
		{ timeout: 45_000 },
		async () => {
			const require = createRequire(resolve(root, 'package.json'));
			const { createServer } = await import(pathToFileURL(require.resolve('vite')).href);
			const vite = await createServer({
				root,
				configFile: resolve(root, 'vite.config.js'),
				server: { host: '127.0.0.1', port: 0, proxy: { '/app/api': origin } },
			});
			const browser = await chromium.launch();
			try {
				await vite.listen();
				const address = vite.httpServer.address();
				const devOrigin = `http://127.0.0.1:${address.port}`;
				assert(vite.config.optimizeDeps.exclude.includes('@ripple-ts/tanstack-router'));
				assert(vite.config.optimizeDeps.exclude.includes('ripple'));
				const page = await browser.newPage();
				page.setDefaultTimeout(15_000);
				const errors = [];
				page.on('pageerror', (error) => errors.push(error.message));
				const html = (await (await fetch(`${origin}/app/posts/one?page=1`)).text())
					.replaceAll(entry, '/app/client.js')
					.replace(/<link\b[^>]*href="\/app\/assets\/[^"]+"[^>]*>/g, '');
				await page.route(`${devOrigin}/app/posts/one?page=1`, (route) =>
					route.fulfill({ contentType: 'text/html', body: html }),
				);
				await page.goto(`${devOrigin}/app/posts/one?page=1`);
				await page.evaluate(async () => {
					window.app = await import('/app/client.js');
				});
				await page.waitForFunction(() => window.app.router.state.status === 'idle');
				await heading(page, 'Post one');
				await navigate(page, {
					to: '/posts/$postId',
					params: { postId: 'two' },
					search: { page: 2 },
				});
				await heading(page, 'Post two');
				assert.deepEqual(errors, []);
				const metadata = JSON.parse(
					await readFile(resolve(vite.config.cacheDir, 'deps/_metadata.json'), 'utf8'),
				);
				assert(
					Object.keys(metadata.optimized).some((name) => name.includes('@tanstack/router-core')),
					'the optimizer must actually process core dependencies',
				);
				assert(
					!metadata.optimized['@ripple-ts/tanstack-router'],
					'TSRX adapter stays outside prebundling',
				);
				results.push({ optimizer: Object.keys(metadata.optimized), passed: true });
			} finally {
				await browser.close();
				await vite.close();
			}
		},
	);

	for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
		if (process.env.BROWSERS && !process.env.BROWSERS.split(',').includes(name)) continue;
		const browser = await type.launch();
		results.push({ browser: name, version: browser.version() });
		async function scenario(title, run) {
			await test(`${name}: ${title}`, { timeout: 45_000 }, async (t) => {
				const context = await browser.newContext();
				await context.addInitScript(() => {
					window.animationRejections = [];
					const start = document.startViewTransition?.bind(document);
					if (!start) return;
					const transitions = [];
					document.startViewTransition = (options) => {
						const transition = start(options);
						const record = { transition, updated: false };
						transitions.push(record);
						transition.updateCallbackDone.then(
							() => {
								record.updated = true;
							},
							() => {},
						);
						return transition;
					};
					addEventListener('unhandledrejection', (event) => {
						const record = transitions.find((record) => record.transition.ready === event.promise);
						// TanStack/router#7906: core consumes updateCallbackDone but leaves
						// ready unobserved. Account for a native skip, never application errors.
						if (
							record &&
							event.reason?.name === 'AbortError' &&
							event.reason.message.startsWith('Transition was skipped')
						) {
							window.animationRejections.push({ record, message: event.reason.message });
							event.preventDefault();
						}
					});
				});
				const page = await context.newPage();
				page.setDefaultTimeout(10_000);
				context.setDefaultTimeout(10_000);
				const errors = [];
				page.on('pageerror', (error) => errors.push(error.message));
				t.after(async () => {
					await context.close();
				});
				try {
					await run(page, context);
				} catch (error) {
					results.push({ browser: name, scenario: title, passed: false, error: String(error) });
					console.error(error);
					await page.screenshot({ path: `${reportDir}/${name}-failure.png` }).catch(() => {});
					throw error;
				}
				assert.deepEqual(errors, [], 'no unexpected browser errors');
				const animationRejections = await page.evaluate(() =>
					window.animationRejections.map(({ record, message }) => ({
						updated: record.updated,
						message,
					})),
				);
				assert(
					animationRejections.every((record) => record.updated),
					'skipped animations still complete their native update callbacks',
				);
				results.push({
					browser: name,
					scenario: title,
					passed: true,
					upstreamAnimationRejections: animationRejections,
				});
			});
		}
		try {
			await scenario(
				'direct entry, hydration, reload, typed updates and retained layout',
				async (page) => {
					let release;
					const gate = new Promise((resolve) => {
						release = resolve;
					});
					await page.route(`**${entry}`, async (route) => {
						await gate;
						await route.continue();
					});
					const api = [];
					page.on('request', (request) => {
						if (request.url().includes('/api/')) api.push(request.url());
					});
					await page.goto(`${origin}/app/posts/one?page=2`, { waitUntil: 'commit' });
					await heading(page, 'Post one');
					await page.locator('h1').evaluate((node) => {
						window.serverHeading = node;
					});
					release();
					await ready(page);
					assert.equal(await page.evaluate(() => document.compatMode), 'CSS1Compat');
					assert.equal(
						await page.evaluate(() => window.serverHeading === document.querySelector('h1')),
						true,
					);
					assert.equal(api.length, 0, 'hydration must not refetch server loaders');
					assert.equal(await page.locator('[data-post]').textContent(), 'one: page 2');
					await page.getByRole('button', { name: 'Layout count: 0' }).click();
					await page.getByRole('link', { name: 'Update post' }).click();
					await heading(page, 'Post two');
					await ready(page);
					assert.equal(await page.locator('[data-post]').textContent(), 'two: page 3');
					assert.equal(await page.getByRole('button', { name: 'Layout count: 1' }).count(), 1);
					assert.equal(new URL(page.url()).pathname, '/app/posts/two');
					await page.reload();
					await ready(page);
					assert.equal(await page.locator('[data-post]').textContent(), 'two: page 3');
					assert.equal(await page.title(), 'Post two');
				},
			);
			await scenario(
				'history, native modified clicks, preloads, pending and errors',
				async (page, context) => {
					await visit(page);
					const loaded = page.waitForResponse((response) =>
						response.url().includes('/api/posts/two'),
					);
					await page.getByRole('link', { name: 'Second post', exact: true }).hover();
					await loaded;
					let duplicateLoads = 0;
					page.on('request', (request) => {
						if (request.url().includes('/api/posts/two')) duplicateLoads++;
					});
					await page.getByRole('link', { name: 'Second post', exact: true }).click();
					await heading(page, 'Post two');
					assert.equal(duplicateLoads, 0, 'navigation consumes preloaded data');
					await page.goBack();
					await heading(page, 'Ripple Router example');
					await page.goForward();
					await heading(page, 'Post two');
					const popupPromise = context.waitForEvent('page');
					// WebKit's headless embedder uses the platform keyboard modifier for new tabs.
					await page
						.getByRole('link', { name: 'First post', exact: true })
						.click(name === 'webkit' ? { modifiers: ['ControlOrMeta'] } : { button: 'middle' });
					const popup = await popupPromise;
					await popup.waitForLoadState();
					await heading(popup, 'Post one');
					assert.equal(new URL(page.url()).pathname, '/app/posts/two');
					await popup.close();
					await page.getByRole('link', { name: 'Slow post', exact: true }).click();
					await page.getByRole('status').filter({ hasText: 'Loading post' }).waitFor();
					await heading(page, 'Post slow');
					await page.getByRole('link', { name: 'Broken post', exact: true }).click();
					await page.getByRole('alert').filter({ hasText: 'Post could not be loaded' }).waitFor();
					await page.getByRole('link', { name: 'Lazy page', exact: true }).click();
					await heading(page, 'Explicitly lazy page');
				},
			);
			await scenario('blocker cancellation and approval', async (page) => {
				await visit(page, '/edit');
				await page.getByRole('button', { name: 'Make changes' }).click();
				await page.getByRole('link', { name: 'Home', exact: true }).click();
				await page.getByRole('dialog').waitFor();
				await page.getByRole('button', { name: 'Stay', exact: true }).click();
				assert.equal(new URL(page.url()).pathname, '/app/edit');
				await page.getByRole('link', { name: 'Home', exact: true }).click();
				await page.getByRole('button', { name: 'Leave', exact: true }).click();
				await heading(page, 'Ripple Router example');
			});
			await scenario('scroll restoration and render completion', async (page) => {
				await visit(page);
				await page.evaluate(() => window.scrollTo(0, 800));
				await page.waitForFunction(() => window.scrollY === 800);
				// Allow the browser to dispatch the actual scroll event before navigating.
				await page.evaluate(
					() =>
						new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
				);
				await navigate(page, {
					to: '/posts/$postId',
					params: { postId: 'one' },
					search: { page: 1 },
				});
				await page.waitForFunction(() => window.scrollY === 0);
				await page.goBack();
				await heading(page, 'Ripple Router example');
				await page.waitForFunction(() => window.scrollY === 800);
				await navigate(page, {
					to: '/posts/$postId',
					params: { postId: 'one' },
					search: { page: 1 },
					hash: 'bottom',
				});
				await page.waitForFunction(
					() => document.getElementById('bottom').getBoundingClientRect().top < innerHeight,
				);
			});
			await scenario('streamed SSR hydrates and navigates', async (page) => {
				await page.goto(`${origin}/app/stream?stream=1`, { waitUntil: 'commit' });
				await heading(page, 'Streaming page');
				await page.locator('[data-message]').waitFor();
				await ready(page);
				assert.equal(
					await page.locator('[data-message]').textContent(),
					'Deferred message arrived',
				);
				assert.equal(await page.evaluate(() => document.compatMode), 'CSS1Compat');
				await page.getByRole('link', { name: 'First post', exact: true }).click();
				await heading(page, 'Post one');
			});
			await scenario(
				'repeated navigation and provider disposal release owned work',
				async (page) => {
					await visit(page, '/posts/one?page=1');
					await page.getByRole('button', { name: 'Layout count: 0' }).click();
					await page.evaluate(() => {
						window.retainedLayout = document.querySelector('section');
						window.commits = [];
						window.unsubscribe = window.app.router.subscribe('onRendered', (event) =>
							window.commits.push(event.toLocation.href),
						);
					});
					for (let i = 0; i < 20; i++) {
						await navigate(page, {
							to: '/posts/$postId',
							params: { postId: i % 2 ? 'one' : 'two' },
							search: { page: i + 2 },
						});
						assert.equal(await page.getByRole('button', { name: 'Layout count: 1' }).count(), 1);
						assert.equal(
							await page.evaluate(
								() => window.retainedLayout === document.querySelector('section'),
							),
							true,
						);
					}
					assert.equal(await page.evaluate(() => window.commits.length), 20);
					for (let i = 0; i < 8; i++) {
						await page.evaluate(() => window.app.remount());
						await ready(page);
						assert.equal(await page.evaluate(() => window.app.router.history.subscribers.size), 1);
					}
					await page.evaluate(() => {
						window.unsubscribe();
						window.app.dispose();
					});
					assert.equal(await page.evaluate(() => window.app.router.history.subscribers.size), 0);
					assert.equal(await page.locator('#app').textContent(), '');
				},
			);
			await scenario('unsupported view transition fallback', async (page) => {
				await page.addInitScript(() => {
					document.startViewTransition = undefined;
				});
				await visit(page);
				await page.getByRole('link', { name: 'First post', exact: true }).click();
				await heading(page, 'Post one');
				await ready(page);
			});
			if (name === 'chromium') {
				await scenario(
					'native snapshots, animation separation, skipping and interruption',
					async (page) => {
						await page.addInitScript(() => {
							const start = document.startViewTransition.bind(document);
							window.transitions = [];
							document.startViewTransition = function (options) {
								const callback = typeof options === 'function' ? options : options.update;
								const record = {
									old: document.querySelector('h1')?.textContent,
									finished: false,
									ready: false,
								};
								window.transitions.push(record);
								const update = async () => {
									await callback();
									record.new = document.querySelector('h1')?.textContent;
								};
								const transition = start(
									typeof options === 'function' ? update : { ...options, update },
								);
								record.transition = transition;
								transition.ready.then(
									() => {
										record.ready = true;
									},
									() => {},
								);
								transition.finished.then(() => {
									record.finished = true;
								});
								return transition;
							};
						});
						await visit(page);
						await page.addStyleTag({
							content:
								'::view-transition-old(route), ::view-transition-new(route) { animation-duration: 3s; }',
						});
						await page.evaluate(async () => {
							await window.app.router.navigate({
								to: '/posts/$postId',
								params: { postId: 'one' },
								search: { page: 1 },
								viewTransition: true,
							});
							window.navigationFinished = window.transitions.at(-1).finished;
						});
						await page.waitForFunction(() => window.transitions.at(-1).ready);
						assert.equal(
							await page.evaluate(() => window.navigationFinished),
							false,
							'render completion does not await animation',
						);
						assert.deepEqual(
							await page.evaluate(() => ({
								old: window.transitions.at(-1).old,
								new: window.transitions.at(-1).new,
							})),
							{ old: 'Ripple Router example', new: 'Post one' },
						);
						assert.equal(
							await page.evaluate(
								() => getComputedStyle(document.querySelector('main')).viewTransitionName,
							),
							'route',
						);
						await page.screenshot({ path: `${reportDir}/chromium-native-transition.png` });
						await page.evaluate(() => window.transitions.at(-1).transition.skipTransition());
						await page.waitForFunction(() => window.transitions.at(-1).finished);
						await page.screenshot({ path: `${reportDir}/chromium-transition-committed.png` });
						// A new navigation interrupts an animation; its own render remains the
						// acknowledged destination, even after both animations have settled.
						await page.evaluate(() =>
							window.app.router.navigate({ to: '/lazy', viewTransition: true }),
						);
						await page.evaluate(() =>
							window.app.router.navigate({ to: '/', viewTransition: true }),
						);
						await heading(page, 'Ripple Router example');
						await page.evaluate(async () => {
							window.transitions.at(-1).transition.skipTransition();
							await Promise.all(window.transitions.map((record) => record.transition.finished));
						});
						assert.equal(
							await page.evaluate(() => window.app.router.state.resolvedLocation.pathname),
							'/',
						);
					},
				);
				await scenario('reduced motion CSS', async (page) => {
					await page.emulateMedia({ reducedMotion: 'reduce' });
					await visit(page);
					assert.equal(
						await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
						true,
					);
					assert.equal(
						await page.evaluate(
							() =>
								getComputedStyle(document.documentElement, '::view-transition-new(route)')
									.animationDuration,
						),
						'0s',
					);
					await page.getByRole('link', { name: 'Lazy page', exact: true }).click();
					await heading(page, 'Explicitly lazy page');
				});
			}
		} finally {
			await browser.close();
		}
	}
} finally {
	server.closeAllConnections();
	await new Promise((resolve) => server.close(resolve));
	await writeFile(`${reportDir}/report.json`, JSON.stringify(results, null, 2));
	console.log(`Browser/bundle report: ${reportDir}/report.json`);
}
