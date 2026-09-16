import { censusDomNodes, deterministicCount } from '../lib/dom-nodes.mjs';
const FORECAST_PASSES = 5;
export const FORECAST_ITEMS = 7;
export const FORECAST_UPDATES = FORECAST_PASSES * FORECAST_ITEMS + 1;
export function assert(condition, message) {
	if (!condition) throw new Error(`weather-app verify failed: ${message}`);
}

async function installReadyObserver(context) {
	await context.addInitScript(() => {
		window.__weatherReady = new Promise((resolve, reject) => {
			let settled = false;
			const observer = new MutationObserver(check);
			const timeout = window.setTimeout(() => {
				finish(() => reject(new Error('weather app did not become ready within 10s')));
			}, 10_000);

			function finish(callback) {
				if (settled) return;
				settled = true;
				observer.disconnect();
				window.clearTimeout(timeout);
				callback();
			}

			function check() {
				const content = document.querySelector('[data-testid="weather-content"]');
				const loading = document.querySelector('[data-testid="loading"]');
				const location = document.querySelector('[data-testid="current-location"]');
				if (
					content &&
					!content.hidden &&
					loading?.hidden &&
					location?.textContent?.includes('London')
				) {
					// Window performance time is relative to this document's navigation
					// time origin, so this includes the complete cold navigation and boot.
					finish(() => resolve(performance.now()));
				}
			}

			observer.observe(document, {
				attributes: true,
				childList: true,
				characterData: true,
				subtree: true,
			});
			check();
		});
	});
}

export async function openReadyPage(browser, target, pageErrors) {
	// Browser contexts isolate HTTP cache as well as storage. Every measured
	// navigation therefore starts cold without charging context creation itself.
	const context = await browser.newContext({
		timezoneId: 'UTC',
		viewport: { width: 1280, height: 900 },
	});
	await installReadyObserver(context);
	const page = await context.newPage();
	page.on('pageerror', (error) => pageErrors.push(error.message));
	try {
		await page.goto(`${target.url}?mock=true&benchmark=true`, { waitUntil: 'load' });
		const readyMs = await page.evaluate(() => window.__weatherReady);
		return { context, page, readyMs };
	} catch (error) {
		await context.close();
		throw error;
	}
}

async function verifyLoaded(page, expectedLocation, expectedCountry) {
	return await page.evaluate(
		({ locationName, countryName }) => {
			const fail = (message) => {
				throw new Error(`loaded state: ${message}`);
			};
			const expectedDisplayLocation = countryName
				? `${locationName}, ${countryName}`
				: locationName;
			const byTestId = (id) => document.querySelector(`[data-testid="${id}"]`);
			const content = byTestId('weather-content');
			const loading = byTestId('loading');
			const error = byTestId('error');
			const location = byTestId('current-location');
			const pressure = byTestId('pressure');
			const temperature = byTestId('current-temperature');
			const input = byTestId('search-input');

			if (!content || content.hidden) fail('weather content is not visible');
			if (!loading?.hidden) fail('loading state is still visible');
			if (!error?.hidden) fail('error state is visible');
			if (location?.textContent !== expectedDisplayLocation) {
				fail(`location is ${location?.textContent}, expected ${expectedDisplayLocation}`);
			}
			if (temperature?.textContent !== '16°C') fail(`temperature is ${temperature?.textContent}`);
			if (!/^\d+ hPa$/.test(pressure?.textContent || '')) {
				fail(`pressure is not finite: ${pressure?.textContent}`);
			}
			if (document.querySelectorAll('[data-testid="forecast-item"]').length !== 7) {
				fail('forecast does not contain seven items');
			}
			if (input?.value !== locationName) fail(`input is ${input?.value}, expected ${locationName}`);

			return {
				location: location.textContent,
				pressure: pressure.textContent,
				temperature: temperature.textContent,
			};
		},
		{ locationName: expectedLocation, countryName: expectedCountry },
	);
}

async function timeForecastCycle(page) {
	return await page.evaluate(
		async ({ passes, itemCount }) => {
			const waitFor = (predicate, label) =>
				new Promise((resolve, reject) => {
					let settled = false;
					const observer = new MutationObserver(check);
					const timeout = window.setTimeout(
						() => finish(() => reject(new Error(`timeout waiting for ${label}`))),
						5_000,
					);
					function finish(callback) {
						if (settled) return;
						settled = true;
						observer.disconnect();
						window.clearTimeout(timeout);
						callback();
					}
					function check() {
						if (predicate()) finish(resolve);
					}
					observer.observe(document, { attributes: true, childList: true, subtree: true });
					check();
				});

			const items = Array.from(document.querySelectorAll('[data-testid="forecast-item"]'));
			if (items.length !== itemCount) throw new Error(`expected ${itemCount} forecast items`);
			if (document.querySelector('.forecast-item.active'))
				throw new Error('forecast began expanded');

			const t0 = performance.now();
			for (let pass = 0; pass < passes; pass++) {
				for (let index = 0; index < items.length; index++) {
					items[index].click();
					await waitFor(() => {
						const active = document.querySelectorAll('.forecast-item.active');
						return (
							active.length === 1 &&
							active[0] === items[index] &&
							items[index].querySelectorAll('.forecast-item__details').length === 1
						);
					}, `forecast item ${index}`);
				}
			}
			items[items.length - 1].click();
			await waitFor(
				() => document.querySelectorAll('.forecast-item.active').length === 0,
				'forecast collapse',
			);
			const duration = performance.now() - t0;

			if (document.querySelector('.forecast-item__details')) {
				throw new Error('forecast details remained after collapse');
			}
			return duration;
		},
		{ passes: FORECAST_PASSES, itemCount: FORECAST_ITEMS },
	);
}

async function timeSearch(page, city, country, expectError = false) {
	return await page.evaluate(
		async ({ cityName, countryName, shouldError }) => {
			const waitFor = (predicate, label) =>
				new Promise((resolve, reject) => {
					let settled = false;
					const observer = new MutationObserver(check);
					const timeout = window.setTimeout(
						() => finish(() => reject(new Error(`timeout waiting for ${label}`))),
						5_000,
					);
					function finish(callback) {
						if (settled) return;
						settled = true;
						observer.disconnect();
						window.clearTimeout(timeout);
						callback();
					}
					function check() {
						if (predicate()) finish(resolve);
					}
					observer.observe(document, {
						attributes: true,
						childList: true,
						characterData: true,
						subtree: true,
					});
					check();
				});

			const input = document.querySelector('[data-testid="search-input"]');
			const form = document.querySelector('[data-testid="search-form"]');
			const content = document.querySelector('[data-testid="weather-content"]');
			const loading = document.querySelector('[data-testid="loading"]');
			const error = document.querySelector('[data-testid="error"]');
			if (!(input instanceof HTMLInputElement) || !(form instanceof HTMLFormElement)) {
				throw new Error('search controls are missing');
			}

			input.value = cityName;
			input.dispatchEvent(new InputEvent('input', { bubbles: true, data: cityName }));
			const t0 = performance.now();
			form.requestSubmit();

			if (shouldError) {
				await waitFor(
					() => Boolean(error && !error.hidden && loading?.hidden && content?.hidden),
					'visible weather error',
				);
			} else {
				await waitFor(() => {
					const location = document.querySelector('[data-testid="current-location"]');
					return Boolean(
						content &&
						!content.hidden &&
						loading?.hidden &&
						error?.hidden &&
						location?.textContent === `${cityName}, ${countryName}`,
					);
				}, `${cityName} weather`);
			}
			const duration = performance.now() - t0;

			if (shouldError) {
				const expectedMessage =
					'Unable to find location. Please check the city name and try again.';
				const actualMessage = error
					?.querySelector('.error__message')
					?.textContent?.replace(/\s+/g, ' ')
					.trim();
				if (actualMessage !== expectedMessage) {
					throw new Error(`unexpected error message: ${actualMessage}`);
				}
			} else if (localStorage.getItem('weather-app-location') !== cityName) {
				throw new Error(`successful city ${cityName} was not persisted`);
			}
			return duration;
		},
		{ cityName: city, countryName: country, shouldError: expectError },
	);
}

async function captureDomStates(page) {
	const semantic = () => {
		const root = document.querySelector('#main');
		if (!root) throw new Error('missing #main for semantic census');
		const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();
		const byTestId = (id) => document.querySelector(`[data-testid="${id}"]`);
		const testText = (id) => normalize(byTestId(id)?.textContent);
		const visibleText = normalize(root.innerText);
		const input = byTestId('search-input');
		const button = byTestId('search-button');
		const condition = byTestId('current-condition');
		const visibility = (id) => {
			const element = byTestId(id);
			return element instanceof HTMLElement ? !element.hidden : null;
		};
		const snapshotElement = (element) => ({
			tag: element.localName,
			attributes: Array.from(element.attributes)
				.map((attribute) => [
					attribute.name,
					attribute.name === 'class'
						? Array.from(element.classList).sort().join(' ')
						: attribute.value,
				])
				.sort(([left], [right]) => left.localeCompare(right)),
			directText: normalize(
				Array.from(element.childNodes)
					.filter((node) => node.nodeType === Node.TEXT_NODE)
					.map((node) => node.data)
					.join(''),
			),
			properties: {
				...(element instanceof HTMLInputElement ? { value: element.value } : {}),
				...(element instanceof HTMLButtonElement ? { disabled: element.disabled } : {}),
			},
			children: Array.from(element.children).map(snapshotElement),
		});
		const observable = {
			visibleText,
			elementTree: Array.from(root.children).map(snapshotElement),
			visibility: {
				loading: visibility('loading'),
				error: visibility('error'),
				weatherContent: visibility('weather-content'),
			},
			search: {
				value: input instanceof HTMLInputElement ? input.value : null,
				disabled: button instanceof HTMLButtonElement ? button.disabled : null,
			},
			current: {
				location: testText('current-location'),
				icon: testText('current-icon'),
				temperature: testText('current-temperature'),
				condition: testText('current-condition'),
				conditionClasses:
					condition instanceof HTMLElement ? Array.from(condition.classList).sort() : null,
				feelsLike: testText('feels-like'),
				humidity: testText('humidity'),
				windSpeed: testText('wind-speed'),
				pressure: testText('pressure'),
				cloudCover: testText('cloud-cover'),
				windDirection: testText('wind-direction'),
			},
			forecast: Array.from(document.querySelectorAll('[data-testid="forecast-item"]')).map(
				(item) => ({
					text: normalize(item.innerText),
					active: item.classList.contains('active'),
					role: item.getAttribute('role'),
					tabIndex: item instanceof HTMLElement ? item.tabIndex : null,
					ariaLabel: item.getAttribute('aria-label'),
				}),
			),
			footerLinks: Array.from(document.querySelectorAll('.footer__link')).map((link) => ({
				text: normalize(link.textContent),
				href: link instanceof HTMLAnchorElement ? link.href : null,
			})),
		};
		return {
			forecastItems: document.querySelectorAll('[data-testid="forecast-item"]').length,
			weatherDetails: document.querySelectorAll('.weather-detail').length,
			forecastDetails: document.querySelectorAll('.forecast-detail-item').length,
			footerLinks: document.querySelectorAll('.footer__link').length,
			visibleChars: visibleText.length,
			observable,
		};
	};

	const collapsed = {
		dom: await page.evaluate(censusDomNodes, '#main'),
		semantic: await page.evaluate(semantic),
	};
	assert(collapsed.semantic.forecastItems === 7, 'collapsed forecast item count');
	assert(collapsed.semantic.weatherDetails === 6, 'collapsed weather detail count');
	assert(collapsed.semantic.forecastDetails === 0, 'collapsed forecast details are mounted');
	assert(collapsed.semantic.footerLinks === 2, 'footer attribution links');

	await page.evaluate(async () => {
		const first = document.querySelector('[data-testid="forecast-item"]');
		if (!first) throw new Error('missing first forecast item');
		first.click();
		await new Promise((resolve, reject) => {
			const observer = new MutationObserver(check);
			const timeout = window.setTimeout(() => {
				observer.disconnect();
				reject(new Error('forecast did not expand'));
			}, 5_000);
			function check() {
				if (first.classList.contains('active') && first.querySelector('.forecast-item__details')) {
					observer.disconnect();
					window.clearTimeout(timeout);
					resolve();
				}
			}
			observer.observe(first, { attributes: true, childList: true, subtree: true });
			check();
		});
	});

	const expanded = {
		dom: await page.evaluate(censusDomNodes, '#main'),
		semantic: await page.evaluate(semantic),
	};
	assert(expanded.semantic.forecastItems === 7, 'expanded forecast item count');
	assert(expanded.semantic.weatherDetails === 6, 'expanded weather detail count');
	assert(expanded.semantic.forecastDetails === 6, 'expanded forecast detail count');

	// Exercise the upstream keyboard contract while returning the sample to its
	// collapsed state. This is an untimed correctness observation.
	await page.evaluate(async () => {
		const first = document.querySelector('[data-testid="forecast-item"]');
		first.dispatchEvent(
			new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
		);
		await new Promise((resolve, reject) => {
			const observer = new MutationObserver(check);
			const timeout = window.setTimeout(() => {
				observer.disconnect();
				reject(new Error('keyboard activation did not collapse forecast'));
			}, 5_000);
			function check() {
				if (!document.querySelector('.forecast-item.active')) {
					observer.disconnect();
					window.clearTimeout(timeout);
					resolve();
				}
			}
			observer.observe(document, { attributes: true, childList: true, subtree: true });
			check();
		});
	});

	return { collapsed, expanded };
}

export async function runScenario(page, readyMs) {
	await verifyLoaded(page, 'London', 'United Kingdom');
	const forecastCycle = await timeForecastCycle(page);
	const searchCity = await timeSearch(page, 'Tokyo', 'Japan');
	await verifyLoaded(page, 'Tokyo', 'Japan');
	const searchError = await timeSearch(page, 'InvalidCity123', '', true);
	const searchRecover = await timeSearch(page, 'Paris', 'France');
	await verifyLoaded(page, 'Paris', 'France');
	const dom = await captureDomStates(page);
	return { readyMs, forecastCycle, searchCity, searchError, searchRecover, dom };
}

export function constantMetric(samples, read, label) {
	const values = samples.map(read);
	const unique = new Set(values);
	assert(unique.size === 1, `${label} varied across samples: ${values.join(', ')}`);
	return deterministicCount(values[0]);
}

export function assertConstantSnapshot(samples, read, label) {
	const values = samples.map((sample) => JSON.stringify(read(sample)));
	assert(new Set(values).size === 1, `${label} varied across samples`);
}
