// Weather Front benchmark — production-browser ports from
// lissy93/framework-benchmarks, including an idiomatic Octane TSRX implementation.
// Every timed operation is driven through the public DOM and verified afterward.

import fs from 'node:fs';
import { chromium } from 'playwright';
import { deterministicCount, deterministicStatForJson } from '../lib/dom-nodes.mjs';
import {
	FORECAST_ITEMS,
	FORECAST_UPDATES,
	runScenario,
	openReadyPage,
	assert,
	constantMetric,
	assertConstantSnapshot,
} from './scenario.mjs';
import { summarizeSamples, timingStatForJson } from '../lib/stats.mjs';

const ITER = parseInt(process.argv[2] || '8', 10);
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

async function runTarget(target) {
	const browser = await chromium.launch({
		headless: true,
		args: ['--disable-extensions', '--js-flags=--expose-gc'],
	});
	const pageErrors = [];

	try {
		// Warm the browser process and preview server in a throwaway context. Sample
		// contexts remain isolated, so their asset and mock fetches are still cold.
		const warmup = await openReadyPage(browser, target, pageErrors);
		try {
			await runScenario(warmup.page, warmup.readyMs);
		} finally {
			await warmup.context.close();
		}

		const samples = [];
		for (let index = 0; index < ITER; index++) {
			const sample = await openReadyPage(browser, target, pageErrors);
			try {
				samples.push(await runScenario(sample.page, sample.readyMs));
			} finally {
				await sample.context.close();
			}
		}

		assert(pageErrors.length === 0, `uncaught page errors: ${pageErrors.join('; ')}`);
		const summarize = (read) =>
			timingStatForJson(summarizeSamples(samples.map(read), { scoreMode: 'mean' }));
		const collapsed = (sample) => sample.dom.collapsed;
		const expanded = (sample) => sample.dom.expanded;
		assertConstantSnapshot(
			samples,
			(sample) => collapsed(sample).semantic.observable,
			'collapsed observable snapshot',
		);
		assertConstantSnapshot(
			samples,
			(sample) => expanded(sample).semantic.observable,
			'expanded observable snapshot',
		);

		return {
			name: target.name,
			ops: {
				initial_ready: summarize((sample) => sample.readyMs),
				forecast_cycle: summarize((sample) => sample.forecastCycle),
				search_city: summarize((sample) => sample.searchCity),
				search_error: summarize((sample) => sample.searchError),
				search_recover: summarize((sample) => sample.searchRecover),
				nodes_loaded: constantMetric(
					samples,
					(sample) => collapsed(sample).dom.total,
					'nodes_loaded',
				),
				elements_loaded: constantMetric(
					samples,
					(sample) => collapsed(sample).dom.elements,
					'elements_loaded',
				),
				text_loaded: constantMetric(samples, (sample) => collapsed(sample).dom.text, 'text_loaded'),
				comments_loaded: constantMetric(
					samples,
					(sample) => collapsed(sample).dom.comments,
					'comments_loaded',
				),
				nodes_expanded: constantMetric(
					samples,
					(sample) => expanded(sample).dom.total,
					'nodes_expanded',
				),
				elements_expanded: constantMetric(
					samples,
					(sample) => expanded(sample).dom.elements,
					'elements_expanded',
				),
				text_expanded: constantMetric(
					samples,
					(sample) => expanded(sample).dom.text,
					'text_expanded',
				),
				comments_expanded: constantMetric(
					samples,
					(sample) => expanded(sample).dom.comments,
					'comments_expanded',
				),
				visible_chars_loaded: constantMetric(
					samples,
					(sample) => collapsed(sample).semantic.visibleChars,
					'visible_chars_loaded',
				),
				visible_chars_expanded: constantMetric(
					samples,
					(sample) => expanded(sample).semantic.visibleChars,
					'visible_chars_expanded',
				),
				forecast_items: deterministicCount(FORECAST_ITEMS),
				weather_details: deterministicCount(6),
				forecast_details_expanded: deterministicCount(6),
			},
			meta: {
				gate: 'passed',
				forecastUpdates: FORECAST_UPDATES,
				mockMode: true,
				upstreamCommit: 'd3f0dcd07c9223c4847baddf9bfa49f060adf24a',
				dom: samples[0].dom,
			},
		};
	} finally {
		await browser.close();
	}
}

const targetResults = [];
const failures = [];
for (const target of TARGETS) {
	console.error(`Running ${target.name} (${target.url}) × ${ITER}…`);
	try {
		targetResults.push(await runTarget(target));
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		failures.push(`${target.name}: ${message}`);
		targetResults.push({ name: target.name, ops: {}, meta: { gate: 'failed', error: message } });
	}
}

const referenceResult = targetResults.find((target) => target.name === 'react');
if (referenceResult?.meta.gate === 'passed') {
	for (const target of targetResults) {
		if (target.name === referenceResult.name || target.meta.gate !== 'passed') continue;
		for (const operation of [
			'elements_loaded',
			'elements_expanded',
			'visible_chars_loaded',
			'visible_chars_expanded',
			'forecast_items',
			'weather_details',
			'forecast_details_expanded',
		]) {
			const targetValue = target.ops[operation].median;
			const referenceValue = referenceResult.ops[operation].median;
			if (targetValue !== referenceValue) {
				failures.push(
					`semantic parity: ${target.name} ${operation} differs (${targetValue} vs ${referenceValue} React)`,
				);
			}
		}
		for (const state of ['collapsed', 'expanded']) {
			const targetSnapshot = target.meta.dom[state].semantic.observable;
			const referenceSnapshot = referenceResult.meta.dom[state].semantic.observable;
			if (JSON.stringify(targetSnapshot) !== JSON.stringify(referenceSnapshot)) {
				failures.push(`semantic parity: ${target.name} ${state} observable snapshot differs`);
			}
		}
	}
}

console.log();
const operationWidth = 28;
console.log(
	'Op'.padEnd(operationWidth) + '| ' + TARGETS.map((target) => target.name.padEnd(24)).join('| '),
);
console.log('-'.repeat(operationWidth) + '+-' + TARGETS.map(() => '-'.repeat(24)).join('+-'));
for (const operation of [
	'initial_ready',
	'forecast_cycle',
	'search_city',
	'search_error',
	'search_recover',
	'nodes_loaded',
	'elements_loaded',
	'text_loaded',
	'comments_loaded',
	'nodes_expanded',
	'elements_expanded',
	'text_expanded',
	'comments_expanded',
	'visible_chars_loaded',
	'visible_chars_expanded',
]) {
	const cells = targetResults.map((target) => {
		const result = target.ops[operation];
		if (!result) return 'failed'.padEnd(24);
		const value = result.score ?? result.median;
		const suffix =
			operation.includes('ready') || operation.includes('cycle') || operation.startsWith('search_')
				? 'ms'
				: '';
		return `${Number(value).toFixed(suffix ? 2 : 0)}${suffix}`.padEnd(24);
	});
	console.log(operation.padEnd(operationWidth) + '| ' + cells.join('| '));
}

// Ripple's result schema records a sample count, not the internal sample array.
for (const target of targetResults) {
	for (const [operation, stat] of Object.entries(target.ops)) {
		if (stat.unit === 'count') target.ops[operation] = deterministicStatForJson(stat);
	}
}

const payload = {
	suite: 'weather-app',
	iterations: ITER,
	targets: targetResults,
	...(failures.length === 0 ? {} : { failed: failures.join('; ') }),
};
if (process.env.BENCH_JSON) {
	fs.writeFileSync(process.env.BENCH_JSON, JSON.stringify(payload, null, '\t') + '\n');
	console.error(`BENCH_JSON written to ${process.env.BENCH_JSON}`);
}
if (failures.length > 0) {
	console.error(failures.join('\n'));
	process.exitCode = 1;
}
