import assert from 'node:assert/strict';

function responseNonce(response) {
	const policy = response.headers.get('content-security-policy');
	assert(policy && !policy.includes('unsafe-'), 'strict policy is enforced');
	const nonce = policy.match(/script-src 'nonce-([^']+)' 'strict-dynamic'/)?.[1];
	assert(nonce, 'response has a script nonce');
	assert(policy.includes(`style-src 'self' 'nonce-${nonce}'`));
	assert.equal(response.headers.get('cache-control'), 'private, no-store');
	return nonce;
}

export async function cspScenarios({ scenario, origin, entry, ready, navigate, heading }) {
	await scenario(
		'CSP concurrent responses authorize only their own shell and late records',
		async (page) => {
			const nonces = await Promise.all(
				['/csp', '/csp?stream=1', '/stream?stream=1'].map(async (path) => {
					const response = await fetch(`${origin}/app${path}`);
					const nonce = responseNonce(response);
					const html = await response.text();
					const tags = html.match(/<(?:script|style|link)\b[^>]*>/g);
					assert(tags.length > 3);
					for (const tag of tags) {
						if (tag.includes('type="application/json"')) continue;
						assert(
							tag.includes(`nonce="${nonce}"`),
							`authorized element uses response nonce: ${tag}`,
						);
					}
					return nonce;
				}),
			);
			assert.equal(new Set(nonces).size, nonces.length);
			await page.goto(`${origin}/app/`);
			await ready(page);
		},
	);

	for (const mode of ['', '?stream=1']) {
		await scenario(
			`CSP ${mode ? 'streamed' : 'buffered'} nested output, CSS and lazy navigation`,
			async (page) => {
				let release;
				const gate = new Promise((resolve) => {
					release = resolve;
				});
				await page.route(`**${entry}`, async (route) => {
					await gate;
					await route.continue();
				});
				await page.goto(`${origin}/app/csp${mode}`, { waitUntil: 'commit' });
				await page.locator('[data-csp-child]').waitFor();
				await page.locator('h1').evaluate((node) => {
					window.serverHeading = node;
				});
				assert.equal(
					await page.locator('.late-style').evaluate((node) => getComputedStyle(node).color),
					'rgb(21, 43, 65)',
				);
				assert.equal(
					await page.evaluate(() => document.documentElement.dataset.hydrated),
					undefined,
				);
				if (mode) {
					assert.equal(
						await page.evaluate(() => typeof window.__RIPPLE_S__),
						'function',
						'stream bootstrap actually executed',
					);
					assert.equal(
						await page.locator('template[data-ripple-chunk]').count(),
						0,
						'late patches executed',
					);
				}
				release();
				await ready(page);
				assert.equal(
					await page.evaluate(() => window.serverHeading === document.querySelector('h1')),
					true,
				);
				await navigate(page, { to: '/lazy' });
				await heading(page, 'Explicitly lazy page');
				assert.equal(
					await page.locator('h1').evaluate((node) => getComputedStyle(node).color),
					'rgb(12, 34, 56)',
				);
				assert.equal(
					await page.locator('.route-style').evaluate((node) => getComputedStyle(node).color),
					'rgb(7, 8, 9)',
				);
				assert.deepEqual(
					await page.evaluate(() => [
						window.lazyHeadRuns,
						window.lazyBodyRuns,
						window.lazyTemplateRuns,
					]),
					[1, 1, 1],
				);
				assert.equal(
					await page.evaluate(() => {
						const nonce = document.querySelector('meta[property="csp-nonce"]').nonce;
						return (
							!!nonce &&
							[
								...document.querySelectorAll(
									'link[rel="modulepreload"], link[rel="stylesheet"], #lazy-head-script, #lazy-body-script, #lazy-template-script',
								),
							].every((node) => node.nonce === nonce)
						);
					}),
					true,
					'route assets and Vite lazy CSS/preloads retain the nonce',
				);
				await page.evaluate(() => window.app.dispose());
				assert.equal(await page.locator('[data-ripple-router-asset]').count(), 0);
			},
		);
	}

	for (const outcome of ['error', 'missing', 'patch-error']) {
		await scenario(`CSP late streamed ${outcome} reaches its route boundary`, async (page) => {
			const response = await page.goto(`${origin}/app/csp/${outcome}?stream=1`);
			await ready(page);
			await page
				.getByText(
					outcome === 'patch-error'
						? 'An error occurred during async rendering'
						: outcome === 'error'
							? 'Late CSP error'
							: 'Page not found',
					{ exact: true },
				)
				.waitFor();
			if (outcome === 'patch-error') assert.match(await response.text(), /__RIPPLE_S__\([^)]*,1\)/);
			await navigate(page, { to: '/lazy' });
			await heading(page, 'Explicitly lazy page');
		});
	}

	await scenario('CSP blocks inline scripts with absent or wrong nonces', async (page) => {
		// Parser-inserted controls exercise the actual response policy; browser
		// automation's evaluate context can exempt its own script insertions.
		await page.route(`${origin}/app/`, async (route) => {
			const response = await route.fetch();
			const body = (await response.text()).replace(
				'<head>',
				'<head><script>window.unauthorizedMissing = true</script><script nonce="wrong-nonce">window.unauthorizedWrong = true</script>',
			);
			await route.fulfill({ response, body });
		});
		await page.goto(`${origin}/app/`);
		await ready(page);
		await page.waitForFunction(() => window.cspViolations.length === 2);
		assert.deepEqual(
			await page.evaluate(() => [window.unauthorizedMissing, window.unauthorizedWrong]),
			[undefined, undefined],
		);
		assert.deepEqual(await page.evaluate(() => window.cspViolations), [
			{ directive: 'script-src-elem', blocked: 'inline' },
			{ directive: 'script-src-elem', blocked: 'inline' },
		]);
		// Only these deliberately triggered violations are allowed by the harness.
		await page.evaluate(() => {
			window.cspViolations = [];
		});
	});
}
