// Lighthouse navigation benchmark for the production weather fixtures.
// Stable category thresholds and structural checks are correctness gates;
// numeric ops are lower-is-better load metrics for the unified runner.

process.env.NODE_ENV = 'production';

import fs from 'node:fs';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/lr-desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from 'playwright';
import { summarizeSamples, timingStatForJson } from '../lib/stats.mjs';

const ITER = parseInt(process.argv[2] || '5', 10);
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const THRESHOLDS = {
	performance: 80,
	accessibility: 90,
	'best-practices': 80,
	seo: 90,
};
const GATED_CATEGORIES = new Set(['accessibility', 'best-practices', 'seo']);
const METRICS = {
	first_contentful_paint: 'first-contentful-paint',
	largest_contentful_paint: 'largest-contentful-paint',
	speed_index: 'speed-index',
	total_blocking_time: 'total-blocking-time',
	cumulative_layout_shift: 'cumulative-layout-shift',
};
const OBSERVED_METRICS = {
	observed_first_contentful_paint: 'observedFirstContentfulPaint',
	observed_largest_contentful_paint: 'observedLargestContentfulPaint',
};
const OPERATIONS = [...Object.keys(METRICS), ...Object.keys(OBSERVED_METRICS)];
const TARGETS = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)
	: [
			{ name: 'octane-tsrx', url: 'http://localhost:5292/' },
			{ name: 'ripple', url: 'http://localhost:5298/' },
			{ name: 'react', url: 'http://localhost:5293/' },
			{ name: 'preact', url: 'http://localhost:5294/' },
			{ name: 'solid', url: 'http://localhost:5295/' },
			{ name: 'svelte', url: 'http://localhost:5296/' },
			{ name: 'vue', url: 'http://localhost:5297/' },
			{ name: 'inferno', url: 'http://localhost:5335/' },
		];

function assert(condition, message) {
	if (!condition) throw new Error(`weather-app-lighthouse verify failed: ${message}`);
}

function sampleUrl(target, sample) {
	const url = new URL(target.url);
	url.searchParams.set('mock', 'true');
	url.searchParams.set('benchmark', 'true');
	url.searchParams.set('lighthouseSample', String(sample));
	return url.href;
}

async function verifyTargets() {
	const browser = await chromium.launch({ headless: true });
	try {
		for (const target of TARGETS) {
			const context = await browser.newContext({ locale: 'en-US', timezoneId: 'UTC' });
			const page = await context.newPage();
			const pageErrors = [];
			page.on('pageerror', (error) => pageErrors.push(error.message));
			try {
				await page.goto(sampleUrl(target, 'verify'), { waitUntil: 'load' });
				await page.waitForFunction(
					() => {
						const content = document.querySelector('[data-testid="weather-content"]');
						const loading = document.querySelector('[data-testid="loading"]');
						const location = document.querySelector('[data-testid="current-location"]');
						return Boolean(
							content &&
							!content.hidden &&
							loading?.hidden &&
							location?.textContent === 'London, United Kingdom',
						);
					},
					undefined,
					{ timeout: 10_000 },
				);
				const forecastItems = await page.locator('[data-testid="forecast-item"]').count();
				assert(forecastItems === 7, `${target.name} preflight rendered ${forecastItems} forecasts`);
				assert(pageErrors.length === 0, `${target.name} page errors: ${pageErrors.join('; ')}`);
			} finally {
				await context.close();
			}
		}
	} finally {
		await browser.close();
	}
}

async function auditTarget(target, sample) {
	const config = {
		...desktopConfig,
		settings: {
			...desktopConfig.settings,
			onlyCategories: CATEGORIES,
			locale: 'en-US',
			throttlingMethod: 'simulate',
			disableFullPageScreenshot: true,
		},
	};
	const chrome = await chromeLauncher.launch({
		chromePath: chromium.executablePath(),
		chromeFlags: [
			'--headless=new',
			'--no-sandbox',
			'--disable-gpu',
			'--disable-dev-shm-usage',
			'--disable-extensions',
			'--disable-background-timer-throttling',
			'--disable-backgrounding-occluded-windows',
			'--disable-renderer-backgrounding',
			'--lang=en-US',
		],
		logLevel: 'silent',
	});

	try {
		const result = await lighthouse(
			sampleUrl(target, sample),
			{
				port: chrome.port,
				logLevel: 'silent',
				output: 'json',
			},
			config,
		);
		assert(result?.lhr, `${target.name} sample ${sample} returned no report`);
		const { lhr } = result;
		if (lhr.runtimeError) {
			throw new Error(`${target.name} sample ${sample}: ${lhr.runtimeError.message}`);
		}

		const categories = {};
		for (const category of CATEGORIES) {
			const score = lhr.categories[category]?.score;
			assert(
				Number.isFinite(score) && score >= 0 && score <= 1,
				`${target.name} ${category} score is unavailable`,
			);
			categories[category] = score * 100;
		}

		const metrics = {};
		for (const [operation, audit] of Object.entries(METRICS)) {
			const value = lhr.audits[audit]?.numericValue;
			assert(Number.isFinite(value) && value >= 0, `${target.name} ${audit} is unavailable`);
			metrics[operation] = value;
		}
		const observedMetrics = lhr.audits.metrics?.details?.items?.[0];
		for (const [operation, field] of Object.entries(OBSERVED_METRICS)) {
			const value = observedMetrics?.[field];
			assert(Number.isFinite(value) && value >= 0, `${target.name} ${field} is unavailable`);
			metrics[operation] = value;
		}

		const expectedUrl = new URL(target.url);
		const finalUrl = new URL(lhr.finalDisplayedUrl);
		assert(
			finalUrl.origin === expectedUrl.origin && finalUrl.pathname === expectedUrl.pathname,
			`${target.name} audited unexpected URL ${lhr.finalDisplayedUrl}`,
		);
		const networkRequests = lhr.audits['network-requests']?.details?.items ?? [];
		const mockRequest = networkRequests.find(
			(request) =>
				new URL(request.url).pathname === '/mocks/weather-data.json' && request.statusCode === 200,
		);
		assert(mockRequest, `${target.name} did not load the local weather mock`);
		const externalRequests = networkRequests
			.filter((request) => /^https?:/.test(request.url))
			.filter((request) => new URL(request.url).origin !== expectedUrl.origin)
			.map((request) => request.url);
		assert(
			externalRequests.length === 0,
			`${target.name} made external requests: ${externalRequests.join(', ')}`,
		);
		const javascriptRequests = networkRequests.filter(
			(request) => request.resourceType === 'Script',
		);
		assert(javascriptRequests.length > 0, `${target.name} did not load production JavaScript`);
		const javascript = {
			requests: javascriptRequests.length,
			transferBytes: javascriptRequests.reduce((total, request) => total + request.transferSize, 0),
			resourceBytes: javascriptRequests.reduce((total, request) => total + request.resourceSize, 0),
		};
		assert(
			Number.isFinite(javascript.transferBytes) && javascript.transferBytes > 0,
			`${target.name} JavaScript transfer size is unavailable`,
		);
		assert(
			Number.isFinite(javascript.resourceBytes) && javascript.resourceBytes > 0,
			`${target.name} JavaScript resource size is unavailable`,
		);

		const suboptimalAudits = {};
		for (const category of CATEGORIES) {
			suboptimalAudits[category] = lhr.categories[category].auditRefs
				.filter(({ id, weight }) => weight > 0 && (lhr.audits[id]?.score ?? 1) < 1)
				.map(({ id, weight }) => ({
					id,
					weight,
					title: lhr.audits[id].title,
					score: lhr.audits[id].score,
					displayValue: lhr.audits[id].displayValue,
				}));
		}

		return {
			categories,
			metrics,
			suboptimalAudits,
			lighthouseVersion: lhr.lighthouseVersion,
			chromeUserAgent: lhr.environment.hostUserAgent,
			runWarnings: lhr.runWarnings,
			networkRequestCount: networkRequests.length,
			javascript,
		};
	} finally {
		await chrome.kill();
	}
}

async function auditTargetWithTransportRetry(target, sample) {
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			return await auditTarget(target, sample);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const failedLocalDevTools =
				/^Failed to fetch browser webSocket URL from http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\/json\/version\b/.test(
					message,
				) && /(?:HTTP Bad Gateway|fetch failed|ECONNREFUSED)/.test(message);
			if (!failedLocalDevTools || attempt === 3) throw error;
			console.error(
				`Retrying ${target.name} sample ${sample + 1} after local DevTools startup failure ` +
					`(${attempt}/2)…`,
			);
		}
	}
	throw new Error('unreachable Lighthouse transport retry state');
}

const values = new Map(
	TARGETS.map((target) => [
		target.name,
		{
			target,
			categories: Object.fromEntries(CATEGORIES.map((category) => [category, []])),
			metrics: Object.fromEntries(OPERATIONS.map((operation) => [operation, []])),
			reports: [],
		},
	]),
);
const failures = [];

try {
	await verifyTargets();
	for (let sample = 0; sample < ITER; sample++) {
		const orderedTargets = sample % 2 === 0 ? TARGETS : [...TARGETS].reverse();
		for (const target of orderedTargets) {
			console.error(`Lighthouse ${target.name} sample ${sample + 1}/${ITER}…`);
			const report = await auditTargetWithTransportRetry(target, sample);
			const targetValues = values.get(target.name);
			for (const category of CATEGORIES) {
				targetValues.categories[category].push(report.categories[category]);
			}
			for (const operation of OPERATIONS) {
				targetValues.metrics[operation].push(report.metrics[operation]);
			}
			targetValues.reports.push(report);
		}
	}
} catch (error) {
	failures.push(error instanceof Error ? error.message : String(error));
}

const targets = TARGETS.map((target) => {
	const targetValues = values.get(target.name);
	const ops = {};
	for (const [operation, samples] of Object.entries(targetValues.metrics)) {
		if (samples.length > 0) {
			ops[operation] = timingStatForJson(summarizeSamples(samples, { scoreMode: 'mean' }));
		}
	}

	const categories = {};
	const thresholdFailures = [];
	for (const category of CATEGORIES) {
		const samples = targetValues.categories[category];
		if (samples.length === 0) continue;
		const summary = summarizeSamples(samples, { scoreMode: 'mean' });
		categories[category] = {
			threshold: THRESHOLDS[category],
			score: summary.score,
			median: summary.median,
			min: summary.min,
			samples,
		};
		categories[category].meetsThreshold = summary.min >= THRESHOLDS[category];
		if (GATED_CATEGORIES.has(category) && !categories[category].meetsThreshold) {
			thresholdFailures.push(
				`${category} minimum ${summary.min.toFixed(1)} < ${THRESHOLDS[category]}`,
			);
		}
	}
	if (thresholdFailures.length > 0) {
		failures.push(`${target.name}: ${thresholdFailures.join(', ')}`);
	}

	const lastReport = targetValues.reports.at(-1);
	return {
		name: target.name,
		ops,
		meta: {
			gate: thresholdFailures.length === 0 && ops.first_contentful_paint ? 'passed' : 'failed',
			categories,
			suboptimalAudits: lastReport?.suboptimalAudits ?? {},
			lighthouseVersion: lastReport?.lighthouseVersion ?? null,
			chromeUserAgent: lastReport?.chromeUserAgent ?? null,
			runWarnings: lastReport?.runWarnings ?? [],
			networkRequestCount: lastReport?.networkRequestCount ?? null,
			javascript: lastReport?.javascript ?? null,
			formFactor: 'desktop',
			throttlingMethod: 'simulate',
			observedMetrics: 'unthrottled-trace',
			mockMode: true,
		},
	};
});

const payload = {
	suite: 'weather-app-lighthouse',
	iterations: ITER,
	targets,
	...(failures.length > 0 ? { failed: failures.join(' | ') } : {}),
};

for (const target of targets) {
	const scores = CATEGORIES.map(
		(category) => `${category}=${target.meta.categories[category]?.median?.toFixed(0) ?? 'n/a'}`,
	).join(' ');
	console.log(`${target.name}: ${scores}`);
	for (const [operation, stat] of Object.entries(target.ops)) {
		console.log(`  ${operation}: ${stat.score.toFixed(2)}`);
	}
}

if (process.env.BENCH_JSON) {
	fs.writeFileSync(process.env.BENCH_JSON, JSON.stringify(payload, null, '\t') + '\n');
}
if (failures.length > 0) {
	console.error(failures.join('\n'));
	process.exitCode = 1;
}
