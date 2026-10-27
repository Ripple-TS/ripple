import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export async function securityScenarios({ scenario, origin, ready, navigate, heading }) {
	for (const path of ['static', 'trusted-types', 'trusted-types?stream=1']) {
		await scenario(
			`security ${path}: hydration, trusted HTML, namespaces and script lifecycle`,
			async (page) => {
				const response = await page.goto(`${origin}/app/security/${path}`);
				assert.equal(response.status(), 200);
				await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
				await page.getByText('Deferred ready', { exact: true }).waitFor();
				await page.getByRole('button', { name: 'Count: 0', exact: true }).click();
				await page.getByRole('button', { name: 'Count: 1', exact: true }).waitFor();
				assert.equal(
					await page.locator('h1').evaluate((node) => getComputedStyle(node).color),
					'rgb(31, 63, 95)',
				);
				await page.getByRole('button', { name: 'Toggle details' }).click();
				await page.locator('[data-html] b').waitFor();
				assert.equal(
					await page.locator('svg circle').evaluate((node) => node.namespaceURI),
					'http://www.w3.org/2000/svg',
				);
				assert.equal(
					await page.locator('math mi').evaluate((node) => node.namespaceURI),
					'http://www.w3.org/1998/Math/MathML',
				);
				assert.equal(
					await page.locator('#user-template').evaluate((node) => node.content.textContent),
					'Template content',
				);
				assert.equal(await page.evaluate(() => window.exampleInlineRuns), 1);
				await page.waitForFunction(() => window.compiledScriptLoads === 1);
				await page.getByRole('button', { name: 'Update HTML' }).click();
				for (const target of ['[data-html]', '[data-fragment]', '[data-spread]']) {
					await page.locator(`${target} i`).waitFor();
				}
				await page.locator('[data-editor]').fill('User edit');
				assert.equal(await page.locator('[data-editor]').textContent(), 'User edit');
				await page.getByRole('button', { name: 'Toggle vendor' }).click();
				await page.waitForFunction(() => document.documentElement.dataset.vendor === 'mounted');
				assert.equal(await page.evaluate(() => window.vendorLoads), 1);
				await page.getByRole('button', { name: 'Toggle vendor' }).click();
				await page.waitForFunction(() => !document.documentElement.dataset.vendor);
				assert.equal(await page.locator('script[src$="/security/vendor.js"]').count(), 0);
				if (path === 'static') {
					const headers = response.headers();
					assert(!headers['content-security-policy'].includes('nonce-'));
					assert(headers['cache-control'].startsWith('public'));
					assert.equal(
						await response.text(),
						await (await fetch(response.url())).text(),
						'cached document is reused byte for byte',
					);
				} else {
					assert(
						response
							.headers()
							['content-security-policy'].includes("require-trusted-types-for 'script'"),
					);
					assert.equal(await page.evaluate(() => window.trustedTypes?.defaultPolicy ?? null), null);
					if (await page.evaluate(() => !!window.trustedTypes)) {
						await page.getByRole('button', { name: 'Try unapproved HTML' }).click();
						await page.locator('[data-html-rejected]').waitFor();
						assert.equal(await page.getByText('Unapproved HTML', { exact: true }).count(), 0);
					}
				}
			},
		);
	}

	await scenario(
		'security Trusted Types preserves rejection at native sinks and application policy',
		async (page) => {
			await page.route(`${origin}/app/security/trusted-types`, async (route) => {
				const response = await route.fetch();
				const nonce = response.headers()['content-security-policy'].match(/'nonce-([^']+)'/)[1];
				const control = `<script nonce="${nonce}">
window.ttControls = [];
if (window.trustedTypes) {
 for (const run of [
  () => { document.createElement('div').innerHTML = '<img src=x>'; },
  () => { document.createElement('script').text = 'window.untrusted = true'; },
  () => { document.createElement('script').src = '/app/security/vendor.js'; }
 ]) { try { run(); window.ttControls.push('allowed'); } catch (error) { window.ttControls.push(error.name); } }
}
</script>`;
				await route.fulfill({
					response,
					body: (await response.text()).replace('</head>', `${control}</head>`),
				});
			});
			await page.goto(`${origin}/app/security/trusted-types`);
			await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
			const supported = await page.evaluate(() => !!window.trustedTypes);
			if (!supported) {
				console.log('Trusted Types API unavailable: native enforcement assertions skipped');
				return;
			}
			assert.deepEqual(await page.evaluate(() => window.ttControls), [
				'TypeError',
				'TypeError',
				'TypeError',
			]);
			await page.waitForFunction(() => window.cspViolations.length === 3);
			assert(
				(await page.evaluate(() => window.cspViolations)).every(
					(v) => v.directive === 'require-trusted-types-for',
				),
			);
			assert.equal(
				await page.evaluate(() => {
					try {
						window.__RIPPLE_TRUSTED_TYPES__.createHTML('<img onerror=alert(1)>', 'html');
						return false;
					} catch {
						return true;
					}
				}),
				true,
			);
			assert.equal(
				await page.evaluate(() => {
					try {
						window.__RIPPLE_TRUSTED_TYPES__.createScriptURL(
							'https://untrusted.invalid/script.js',
							'route',
						);
						return false;
					} catch {
						return true;
					}
				}),
				true,
			);
			await page.evaluate(() => {
				window.cspViolations = [];
			});
		},
	);

	await scenario(
		'security hashes reject modified scripts, inline styles and parser-inserted third parties',
		async (page) => {
			await page.route(`${origin}/app/security/static`, async (route) => {
				const response = await route.fetch();
				const controls =
					'<script>window.hashControl = true</script><script src="/app/security/vendor.js"></script><style>h1 { color: red !important; }</style>';
				await route.fulfill({
					response,
					body: (await response.text()).replace('</head>', `${controls}</head>`),
				});
			});
			await page.goto(`${origin}/app/security/static`);
			await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
			await page.waitForFunction(() => window.cspViolations.length === 3);
			assert.deepEqual(await page.evaluate(() => [window.hashControl, window.vendorLoads]), [
				undefined,
				undefined,
			]);
			assert.deepEqual(
				(await page.evaluate(() => window.cspViolations)).map((v) => v.directive).sort(),
				['script-src-elem', 'script-src-elem', 'style-src-elem'],
			);
			assert.equal(
				await page.locator('h1').evaluate((node) => getComputedStyle(node).color),
				'rgb(31, 63, 95)',
			);
			await page.evaluate(() => {
				window.cspViolations = [];
			});
		},
	);

	await scenario(
		'security router assets, hydration and lazy navigation under Trusted Types',
		async (page) => {
			// Use the same application-owned policy before any stream/bootstrap code.
			const policy = await (await fetch(`${origin}/app/security/trusted-types`)).text();
			const bootstrap = policy.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)[1];
			await page.route(`${origin}/app/csp?stream=1`, async (route) => {
				const response = await route.fetch();
				const headers = response.headers();
				const nonce = headers['content-security-policy'].match(/'nonce-([^']+)'/)[1];
				headers['content-security-policy'] +=
					"; require-trusted-types-for 'script'; trusted-types ripple-example ripple-example-content";
				const body = (await response.text()).replace(
					'<head>',
					`<head><script nonce="${nonce}">${bootstrap}</script>`,
				);
				await route.fulfill({ response, headers, body });
			});
			await page.goto(`${origin}/app/csp?stream=1`);
			await ready(page);
			await navigate(page, { to: '/lazy' });
			await heading(page, 'Explicitly lazy page');
			await page.waitForFunction(
				() =>
					window.lazyTemplateRuns === 1 && window.lazyHeadRuns === 1 && window.lazyBodyRuns === 1,
			);
			await page.evaluate(() => window.app.dispose());
			assert.equal(await page.locator('[data-ripple-router-asset]').count(), 0);
		},
	);
}

export async function developmentScenario({ scenario, root }) {
	await scenario(
		'security development: nonce styles, module HMR, WebSocket and disabled overlay',
		async (page) => {
			const { startDevServer } = await import(pathToFileURL(`${root}/dev.js`).href);
			const { server, vite, origin } = await startDevServer(0, [
				{
					name: 'csp-negative-control',
					transformIndexHtml(html) {
						return html.replace(
							'</head>',
							'<script nonce="incorrect">window.devBlocked = true</script></head>',
						);
					},
				},
			]);
			const cssPath = `${root}/security-hmr.css`;
			const original = await readFile(cssPath, 'utf8');
			const modulePath = `${root}/security-hmr.js`;
			const originalModule = await readFile(modulePath, 'utf8');
			try {
				const sockets = [];
				const connected = new Promise((resolve) =>
					page.on('websocket', (socket) => {
						sockets.push(socket.url());
						socket.on('framereceived', (frame) => {
							if (JSON.parse(frame.payload).type === 'connected') resolve();
						});
					}),
				);

				await page.goto(`${origin}/app/security/dev`);
				await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
				await page.waitForFunction(
					() =>
						getComputedStyle(document.documentElement).getPropertyValue('--csp-hmr').trim() ===
						'before',
				);
				await page.getByRole('button', { name: 'Count: 0', exact: true }).click();
				await page.getByRole('button', { name: 'Count: 1', exact: true }).waitFor();
				await connected;
				await writeFile(cssPath, original.replace('before', 'after'));
				await page.waitForFunction(
					() =>
						getComputedStyle(document.documentElement).getPropertyValue('--csp-hmr').trim() ===
						'after',
				);
				assert.equal(
					await page.getByRole('button', { name: 'Count: 1', exact: true }).count(),
					1,
					'CSS HMR preserves app state',
				);
				await writeFile(modulePath, originalModule.replace("'before'", "'after'"));
				await page.waitForFunction(() => document.documentElement.dataset.hmrModule === 'after');
				await page.waitForFunction(() => window.cspViolations.length === 1);
				assert.equal(await page.evaluate(() => window.devBlocked), undefined);
				assert.deepEqual(await page.evaluate(() => window.cspViolations), [
					{ directive: 'script-src-elem', blocked: 'inline' },
				]);
				await page.evaluate(() => {
					window.cspViolations = [];
				});
				assert(sockets.some((url) => url.startsWith(origin.replace('http:', 'ws:'))));
				await page.getByRole('button', { name: 'Toggle vendor' }).click();
				await page.waitForFunction(() => document.documentElement.dataset.vendor === 'mounted');
				await page.getByRole('button', { name: 'Toggle vendor' }).click();
				await page.waitForFunction(() => !document.documentElement.dataset.vendor);

				vite.ws.send({
					type: 'error',
					err: { message: 'Deliberate development error', stack: '', plugin: 'csp-test' },
				});
				await page.waitForTimeout(100);
				assert.equal(await page.locator('vite-error-overlay').count(), 0);
				assert.equal(
					await page.evaluate(() => {
						const nonce = document.querySelector('meta[property="csp-nonce"]').nonce;
						return [...document.querySelectorAll('style[data-vite-dev-id]')].every(
							(node) => node.nonce === nonce,
						);
					}),
					true,
				);
			} finally {
				await writeFile(cssPath, original);
				await writeFile(modulePath, originalModule);
				await vite.close();
				await new Promise((resolve) => server.close(resolve));
			}
		},
	);
}
