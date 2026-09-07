// UIbench desktop workload harness. The public case names and dimensions come
// from localvoid/uibench-base; the fixtures and deterministic model are fresh
// implementations because upstream does not ship usable license text.
//
// Correctness is a precondition for every timing:
//   - every before/after endpoint is serialized from the live DOM and compared
//     with the independent shared model across two complete matrix passes;
//   - keyed survivors must retain DOM identity for every transition;
//   - every target must render the same semantic signatures and element counts
//     (framework marker comments are deliberately outside the oracle).
//
// Servers must be running first (production preview recommended):
//   pnpm --filter octane-tsrx-uibench-bench preview  # :5315
//   pnpm --filter react-uibench-bench preview        # :5316
//   pnpm --filter solid-uibench-bench preview        # :5317
//   pnpm --filter preact-uibench-bench preview       # :5318
//   pnpm --filter vue-vapor-uibench-bench preview    # :5319
//   pnpm --filter ripple-uibench-bench preview       # :5322
//   pnpm --filter inferno-uibench-bench preview      # :5325
//
// Usage: node run.mjs [iterations]
// Env: TARGETS='[{"name":"octane-tsrx","url":"http://localhost:5315/"}]'
//      BENCH_JSON=/path/out.json

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CASES, elementCount, modelSignature } from './shared/workloads.js';
import { scoreOf, summarizeSamples, timingStatForJson } from '../lib/stats.mjs';
import { deterministicCount, deterministicStatForJson } from '../lib/dom-nodes.mjs';

const ITERATIONS = Number.parseInt(process.argv[2] || '10', 10);
if (!Number.isInteger(ITERATIONS) || ITERATIONS < 1) {
	throw new Error(`iterations must be a positive integer, received ${process.argv[2]}`);
}
const WARMUP = process.env.BENCH_QUICK === '1' ? 1 : ITERATIONS >= 5 ? 2 : 1;

function repetitionsFor(name) {
	if (name.startsWith('anim/')) return 64;
	if (name.endsWith('/no_change')) return name.includes('[10,10,10,10]') ? 1 : 4;
	if (name.includes('/[2,2,2,2,2,2,2,2,2,2]/')) return 2;
	if (name.endsWith('/render') || name.endsWith('/removeAll')) {
		return name.startsWith('table/') ? 8 : 4;
	}
	if (name.includes('worst_case')) return 16;
	return 32;
}

const TARGETS = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)
	: [
			{ name: 'octane-tsrx', url: 'http://localhost:5315/' },
			{ name: 'react', url: 'http://localhost:5316/' },
			{ name: 'solid', url: 'http://localhost:5317/' },
			{ name: 'preact', url: 'http://localhost:5318/' },
			{ name: 'vue-vapor', url: 'http://localhost:5319/' },
			{ name: 'ripple', url: 'http://localhost:5322/' },
			{ name: 'inferno', url: 'http://localhost:5325/' },
		];

const EXPECTED = new Map(
	CASES.map((entry) => [
		entry.name,
		{
			before: {
				signature: modelSignature(entry.before),
				elements: elementCount(entry.before),
			},
			after: {
				signature: modelSignature(entry.after),
				elements: elementCount(entry.after),
			},
		},
	]),
);

function writePayload(payload) {
	if (!process.env.BENCH_JSON) return;
	const file = resolve(process.env.BENCH_JSON);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
}

function firstSignatureDifference(actual, expected) {
	const actualLines = actual.split('\n');
	const expectedLines = expected.split('\n');
	const lineCount = Math.max(actualLines.length, expectedLines.length);
	for (let index = 0; index < lineCount; index++) {
		if (actualLines[index] !== expectedLines[index]) {
			return `line ${index + 1}: ${JSON.stringify(actualLines[index])} != ${JSON.stringify(expectedLines[index])}`;
		}
	}
	return 'signatures differ without a line-level mismatch';
}

async function seedRandom(page) {
	await page.evaluate(() => {
		let state = 0x51be11 >>> 0;
		Math.random = () => {
			state = (state + 0x6d2b79f5) | 0;
			let value = Math.imul(state ^ (state >>> 15), 1 | state);
			value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
			return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
		};
	});
}

async function gateTarget(page) {
	return page.evaluate(
		async (names) => {
			const root = document.getElementById('main');
			if (root === null) throw new Error('missing #main');

			const semanticItems = () => {
				const view = root.firstElementChild;
				if (view === null) return [];
				if (view.dataset.kind === 'table') return [...view.querySelectorAll('tbody > tr')];
				if (view.dataset.kind === 'anim') return [...view.querySelectorAll(':scope > .box')];
				return [...view.querySelectorAll('li')];
			};

			const signature = () => {
				const view = root.firstElementChild;
				if (view === null) throw new Error('fixture rendered no view');
				if (view.dataset.kind === 'table') {
					return [
						'table',
						...[...view.querySelectorAll('tbody > tr')].map((row) =>
							[
								row.dataset.id,
								row.getAttribute('class'),
								...[...row.querySelectorAll('td')].map((cell) => cell.textContent),
							].join('|'),
						),
					].join('\n');
				}
				if (view.dataset.kind === 'anim') {
					return [
						'anim',
						...[...view.querySelectorAll(':scope > .box')].map(
							(box) => `${box.dataset.id}|${box.style.transform}`,
						),
					].join('\n');
				}

				const lines = ['tree'];
				const visit = (list, depth) => {
					for (const item of list.children) {
						if (item.localName !== 'li') continue;
						const label = [...item.children].find((child) => child.localName === 'span');
						lines.push(
							`${depth}|${item.dataset.id}|${item.getAttribute('class')}|${label.textContent}`,
						);
						const children = [...item.children].find((child) => child.localName === 'ul');
						if (children) visit(children, depth + 1);
					}
				};
				visit(view, 0);
				return lines.join('\n');
			};

			const results = [];
			for (let cycle = 0; cycle < 2; cycle++) {
				for (const name of names) {
					const prepared = window.__prepare(name);
					if (prepared && typeof prepared.then === 'function') await prepared;
					const beforeItems = semanticItems();
					const before = new Map(beforeItems.map((element) => [element.dataset.id, element]));
					const beforeView = root.firstElementChild;
					const beforeResult = {
						signature: signature(),
						elements: beforeView === null ? 0 : 1 + beforeView.querySelectorAll('*').length,
					};

					const committed = window.__run(name);
					if (committed && typeof committed.then === 'function') await committed;
					const afterItems = semanticItems();
					let identityShared = 0;
					let identityBroken = 0;
					for (const element of afterItems) {
						const previous = before.get(element.dataset.id);
						if (previous === undefined) continue;
						identityShared++;
						if (previous !== element) identityBroken++;
					}
					const afterView = root.firstElementChild;
					results.push({
						name,
						cycle,
						before: beforeResult,
						after: {
							signature: signature(),
							elements: afterView === null ? 0 : 1 + afterView.querySelectorAll('*').length,
						},
						identityShared,
						identityBroken,
					});
				}
			}
			return results;
		},
		CASES.map((entry) => entry.name),
	);
}

async function throwBrowserErrors(page, browserErrors, targetName, phase) {
	// Let pageerror/console events queued by the preceding evaluation reach Playwright.
	await page.evaluate(() => new Promise((resolvePromise) => setTimeout(resolvePromise, 0)));
	if (browserErrors.length > 0) {
		throw new Error(`${targetName} browser errors during ${phase}: ${browserErrors.join(' | ')}`);
	}
}

async function timeCase(page, name) {
	const repetitions = repetitionsFor(name);
	return page.evaluate(
		async ({ caseName, iterations, repetitionsPerSample, warmup }) => {
			const settle = () => new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
			for (let index = 0; index < warmup; index++) {
				for (let repeat = 0; repeat < repetitionsPerSample; repeat++) {
					const prepared = window.__prepare(caseName);
					if (prepared && typeof prepared.then === 'function') await prepared;
					const committed = window.__run(caseName);
					if (committed && typeof committed.then === 'function') await committed;
				}
			}

			const samples = [];
			for (let index = 0; index < iterations; index++) {
				const initial = window.__prepare(caseName);
				if (initial && typeof initial.then === 'function') await initial;
				await settle();
				if (typeof gc === 'function') gc();
				let elapsed = 0;
				for (let repeat = 0; repeat < repetitionsPerSample; repeat++) {
					if (repeat > 0) {
						const prepared = window.__prepare(caseName);
						if (prepared && typeof prepared.then === 'function') await prepared;
					}
					const start = performance.now();
					const committed = window.__run(caseName);
					if (committed && typeof committed.then === 'function') await committed;
					elapsed += performance.now() - start;
				}
				samples.push(elapsed / repetitionsPerSample);
			}
			return samples;
		},
		{
			caseName: name,
			iterations: ITERATIONS,
			repetitionsPerSample: repetitions,
			warmup: WARMUP,
		},
	);
}

export async function runTarget(
	browser,
	target,
	{ gateTargetFn = gateTarget, timeCaseFn = timeCase } = {},
) {
	const context = await browser.newContext();
	const page = await context.newPage();
	const browserErrors = [];
	page.on('pageerror', (error) => browserErrors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error') browserErrors.push(message.text());
	});

	try {
		await page.goto(target.url, { waitUntil: 'load' });
		await page.waitForFunction(() => window.__ready === true);
		const isolated = await page.evaluate(() => window.crossOriginIsolated);
		if (!isolated)
			throw new Error(`${target.name} is not cross-origin isolated; timer precision is unsafe`);
		await seedRandom(page);
		await page.evaluate(() => window.__mount());

		const gates = await gateTargetFn(page);
		let identityShared = 0;
		let maxElements = 0;
		for (const result of gates) {
			const expected = EXPECTED.get(result.name);
			for (const endpoint of ['before', 'after']) {
				if (result[endpoint].signature !== expected[endpoint].signature) {
					const difference = firstSignatureDifference(
						result[endpoint].signature,
						expected[endpoint].signature,
					);
					throw new Error(
						`${target.name} semantic mismatch in ${result.name} ${endpoint} (cycle ${result.cycle + 1}); ${difference}`,
					);
				}
				if (result[endpoint].elements !== expected[endpoint].elements) {
					throw new Error(
						`${target.name} element mismatch in ${result.name} ${endpoint} (cycle ${result.cycle + 1}): ${result[endpoint].elements} != ${expected[endpoint].elements}`,
					);
				}
				maxElements = Math.max(maxElements, result[endpoint].elements);
			}
			if (result.identityBroken !== 0) {
				throw new Error(
					`${target.name} replaced ${result.identityBroken}/${result.identityShared} keyed survivors in ${result.name} (cycle ${result.cycle + 1})`,
				);
			}
			if (result.cycle === 0) identityShared += result.identityShared;
		}

		await throwBrowserErrors(page, browserErrors, target.name, 'the correctness gate');

		const ops = {};
		for (const entry of CASES) {
			const samples = await timeCaseFn(page, entry.name);
			await throwBrowserErrors(page, browserErrors, target.name, `timing ${entry.name}`);
			ops[entry.name] = timingStatForJson(summarizeSamples(samples));
		}
		ops.cases = deterministicStatForJson(deterministicCount(CASES.length));
		ops.elements_largest = deterministicStatForJson(deterministicCount(maxElements));
		ops.identity_shared = deterministicStatForJson(deterministicCount(identityShared));

		return {
			name: target.name,
			ops,
			meta: {
				caseCount: CASES.length,
				maxElements,
				identityShared,
				measurement: 'mean forward-commit latency from a case-sized inner batch',
				correctnessGate: 'passed',
			},
		};
	} finally {
		await context.close();
	}
}

function printResults(targets) {
	const rows = CASES.map((entry) => {
		const row = { case: entry.name };
		for (const target of targets) row[target.name] = scoreOf(target.ops[entry.name])?.toFixed(3);
		if (targets.length > 1) {
			const left = scoreOf(targets[0].ops[entry.name]);
			for (const reference of targets.slice(1)) {
				const right = scoreOf(reference.ops[entry.name]);
				row[`${targets[0].name}/${reference.name}`] = (left / right).toFixed(2);
			}
		}
		return row;
	});
	console.log(
		`\nUIbench desktop matrix (${ITERATIONS} samples, mean milliseconds per forward commit; ${CASES.length} cases)`,
	);
	console.table(rows);
}

export async function main() {
	let browser;
	try {
		browser = await chromium.launch({
			headless: true,
			args: ['--js-flags=--expose-gc'],
		});
		const results = [];
		for (const target of TARGETS) results.push(await runTarget(browser, target));
		printResults(results);
		writePayload({ suite: 'uibench', iterations: ITERATIONS, targets: results });
	} catch (error) {
		const message = error instanceof Error ? error.stack || error.message : String(error);
		console.error(message);
		writePayload({ suite: 'uibench', iterations: ITERATIONS, targets: [], failed: message });
		process.exitCode = 1;
	} finally {
		if (browser) await browser.close();
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	await main();
}
