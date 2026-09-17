// svg-dashboard bench harness — SVG rendering/update stress across octane,
// Ripple, React, Solid, Svelte, and Inferno fixtures rendering the SAME hand-rolled dashboard.
//
// What makes this suite trustworthy:
//   1. data.js/ops.js are vendored VERBATIM into every fixture (md5-gated
//      here), and every DOM-bound string (path d, transform, class, style
//      value, label) is produced by that shared code. The frameworks
//      contribute only binding/reconciliation machinery — the thing measured.
//   2. Before any timing, a scripted op sequence runs against each fixture
//      and the resulting DOM is compared BYTE-FOR-BYTE against a Node-side
//      replay of the same shared ops module (series `d` strings, transforms,
//      viewBox, icon variants, style/spread values, tooltip placement).
//   3. Namespace census: every element must be SVG-namespaced except
//      foreignObject content (XHTML). A wrong-namespace path renders nothing
//      and would look FASTER, so this is a correctness precondition.
//   4. Survivor identity: keyed churn must keep surviving nodes' DOM
//      elements; class writes must land as SVG `class` ATTRIBUTES.
//   5. Cross-flavor parity: a canonical serialization of the element tree
//      (namespace, tag, sorted attributes, per-element text) must hash
//      identically across all six fixtures, at mount and after the scripted
//      sequence. Comments and whitespace-only text are per-framework noise
//      (octane loop/portal markers, svelte anchors) and are excluded but
//      published as census counters.
//   6. Fixtures may not read layout in update paths (getBBox /
//      getBoundingClientRect are instrumented during the gate pass) — a
//      layout read inside the timed window would swamp the samples with
//      forced-layout cost.
//
// Methodology mirrors list-clear/dbmon: window-hook ops committed
// synchronously (flushSync / solid flush()) with the whole warmup+iteration
// loop inside ONE page.evaluate; gc() before each sample; ops are rotational
// so repetition is semantic (ticks, frames, cycles), and each op batch is
// sized to clear ~1.5ms medians on the fastest flavor (the runner refuses to
// call a sub-ms move a regression).
//
// Servers must be running first (production preview recommended):
//   pnpm --filter octane-tsrx-svg-dashboard-bench preview   # :5302
//   pnpm --filter react-svg-dashboard-bench       preview   # :5303
//   pnpm --filter solid-svg-dashboard-bench       preview   # :5304
//   pnpm --filter svelte-svg-dashboard-bench      preview   # :5305
//
// Usage:  node run.mjs [iter]   # default 20
// Env:    TARGETS='[{"name":"octane-tsrx","url":"http://localhost:5302/"}]'
//         BENCH_JSON=/path/out.json

import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreOf, summarizeSamples, timingStatForJson } from '../lib/stats.mjs';
import { censusDomNodes, deterministicCount, deterministicStatForJson } from '../lib/dom-nodes.mjs';
import * as sharedOps from './octane-tsrx/src/ops.js';
import { measureSamples } from './timing.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ITER = parseInt(process.argv[2] || '20', 10);
const WARMUP = Math.min(8, Math.max(2, ITER));
const YIELD_MS = 5;

// Per-sample batch sizes. Repetition is semantic (stream ticks, drag frames,
// tooltip cycles); every batch must keep the fastest flavor's median >= ~1.5ms
// and react under ~30ms. Tune here, never in the op bodies.
const TICKS = 8;
const SPARSE_TICKS = 20;
const DRAG_FRAMES = 30;
const PANZOOM_STEPS = 960; // multiple of 8 so the preset cycle lands evenly
const SELECT_ROUNDS = 4;
const LABEL_ROUNDS = 8;
const TOOLTIP_CYCLES = 90; // 4 commits per cycle
const CHURNS = 2;
const ICON_FLIPS = 3;
const TOGGLE_CYCLES = 3; // off+on per cycle
const PULSES = 6;

const TARGETS = process.env.TARGETS
	? JSON.parse(process.env.TARGETS)
	: [
			{ name: 'octane-tsrx', url: 'http://localhost:5302/' },
			{ name: 'ripple', url: 'http://localhost:5306/' },
			{ name: 'react', url: 'http://localhost:5303/' },
			{ name: 'solid', url: 'http://localhost:5304/' },
			{ name: 'svelte', url: 'http://localhost:5305/' },
			{ name: 'inferno', url: 'http://localhost:5324/' },
		];

const OPS = [
	{ name: 'mount', pre: 'window.__reset();', body: 'window.__mount();' },
	{ name: 'charts_tick', body: `for (let i = 0; i < ${TICKS}; i++) window.__tick();` },
	{ name: 'tick_sparse', body: `for (let i = 0; i < ${SPARSE_TICKS}; i++) window.__tickSparse();` },
	{ name: 'drag_nodes', body: `for (let i = 0; i < ${DRAG_FRAMES}; i++) window.__dragFrame();` },
	{ name: 'pan_zoom', body: `for (let i = 0; i < ${PANZOOM_STEPS}; i++) window.__panZoomStep();` },
	{
		name: 'select_toggle',
		body: `for (let i = 0; i < ${SELECT_ROUNDS}; i++) window.__toggleSelect();`,
	},
	{ name: 'topology_churn', body: `for (let i = 0; i < ${CHURNS}; i++) window.__churnTopology();` },
	{ name: 'label_churn', body: `for (let i = 0; i < ${LABEL_ROUNDS}; i++) window.__labelChurn();` },
	{
		name: 'tooltip_swarm',
		body: `for (let i = 0; i < ${TOOLTIP_CYCLES * 4}; i++) window.__tooltipStep();`,
	},
	{ name: 'icon_swap', body: `for (let i = 0; i < ${ICON_FLIPS}; i++) window.__swapIcons();` },
	{
		name: 'series_toggle',
		body: `for (let i = 0; i < ${TOGGLE_CYCLES}; i++) { window.__toggleSeries(); window.__toggleSeries(); }`,
	},
	{
		name: 'style_spread_pulse',
		body: `for (let i = 0; i < ${PULSES}; i++) window.__pulseEdges();`,
	},
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Same seeded Math.random patch as js-framework — none of the fixtures should
// consume Math.random at all, but a framework-internal use must not inject
// cross-flavor noise.
const seedRandom = (page) =>
	page.evaluate(() => {
		let state = 0x5eed5eed >>> 0;
		Math.random = () => {
			state = (state + 0x6d2b79f5) | 0;
			let value = Math.imul(state ^ (state >>> 15), 1 | state);
			value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
			return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
		};
	});

// ---------------------------------------------------------------------------
// Shared-module identity gate: the whole methodology rests on all six
// fixtures executing byte-identical data.js/ops.js.

function sharedFileFailures() {
	const failures = [];
	for (const file of ['data.js', 'ops.js']) {
		const digests = new Map();
		for (const dir of ['octane-tsrx', 'react', 'solid', 'svelte', 'inferno', 'ripple']) {
			const digest = createHash('md5')
				.update(readFileSync(join(HERE, dir, 'src', file)))
				.digest('hex');
			digests.set(dir, digest);
		}
		if (new Set(digests.values()).size !== 1) {
			failures.push(
				`shared ${file} diverged across fixtures: ` +
					[...digests.entries()].map(([d, h]) => `${d}=${h.slice(0, 8)}`).join(' '),
			);
		}
	}
	return failures;
}

// ---------------------------------------------------------------------------
// Node-side replay: run the SAME shared ops module through the scripted gate
// sequence and capture the expected strings at each checkpoint.

function buildExpected() {
	sharedOps.reset();
	const expected = {};
	const snap = () => sharedOps.snapshotForGates();

	expected.initial = checkpointFrom(snap());
	expected.initialState = sharedOps.currentState();

	for (let i = 0; i < 3; i++) sharedOps.tick();
	expected.afterTicks = { seriesD: seriesDOf(snap()), legend: legendOf(snap()) };

	sharedOps.dragFrame();
	sharedOps.dragFrame();
	expected.afterDrag = {
		nodeTransforms: snap().topo.nodes.map((n) => n.transform),
		edgeD: snap().topo.edges.map((e) => e.d),
		iconTransforms: snap().topo.icons.map((ic) => ic.transform),
	};

	sharedOps.toggleSelect();
	expected.afterSelect = {
		nodeCls: snap().topo.nodes.map((n) => n.cls),
		edgeCls: snap().topo.edges.map((e) => e.cls),
	};

	expected.preChurnIds = snap().topo.nodes.map((n) => n.id);
	sharedOps.churnTopology();
	expected.afterChurn = {
		ids: snap().topo.nodes.map((n) => n.id),
		edgeCount: snap().topo.edges.length,
		labeled: snap().topo.nodes.filter((n) => n.labeled).length,
	};

	sharedOps.labelChurn();
	expected.afterLabelChurn = { labeled: snap().topo.nodes.filter((n) => n.labeled).length };

	expected.tooltips = [];
	for (let i = 0; i < 4; i++) {
		sharedOps.tooltipStep();
		const t = snap().ui.tooltip;
		expected.tooltips.push(t === null ? null : { transform: t.transform, title: t.title });
	}

	sharedOps.swapIcons();
	expected.afterSwap = {
		iconNames: snap().topo.icons.map((ic) => ic.name),
		hrefs: snap().topo.nodes.map((n) => n.href),
	};

	sharedOps.toggleSeries();
	expected.seriesOffCounts = {
		perChart: snap().charts.charts.map((c) => c.series.length),
		yTicks: snap().charts.charts[0].yTicks.map((t) => t.label),
	};
	sharedOps.toggleSeries();
	expected.seriesOnCounts = {
		perChart: snap().charts.charts.map((c) => c.series.length),
		yTicks: snap().charts.charts[0].yTicks.map((t) => t.label),
	};

	sharedOps.pulseEdges();
	expected.afterPulse = {
		strokeWidth: snap().topo.edges[0].style.strokeWidth,
		strokeOpacity: snap().topo.edges[0].style.strokeOpacity,
		flow: snap().topo.edges[0].attrs['data-flow'],
	};

	sharedOps.panZoomStep();
	expected.afterPanZoom = {
		viewBox: snap().ui.viewBox,
		rootTransform: snap().ui.rootTransform,
	};

	expected.finalState = sharedOps.currentState();
	// Leave the module pristine for anyone importing after us.
	sharedOps.reset();
	return expected;
}

function seriesDOf(s) {
	const out = [];
	for (const ch of s.charts.charts) {
		out.push(ch.areaD);
		for (const se of ch.series) out.push(se.lineD);
	}
	return out;
}
function legendOf(s) {
	return s.charts.charts.map((ch) => ch.legend.map((l) => l.label));
}
function checkpointFrom(s) {
	return {
		nodes: s.topo.nodes.length,
		edges: s.topo.edges.length,
		icons: s.topo.icons.length,
		labeled: s.topo.nodes.filter((n) => n.labeled).length,
		viewBox: s.ui.viewBox,
		rootTransform: s.ui.rootTransform,
		seriesD: seriesDOf(s),
		nodeTransforms: s.topo.nodes.map((n) => n.transform),
		nodeCls: s.topo.nodes.map((n) => n.cls),
		sparkD: s.charts.sparks.map((sp) => sp.d),
	};
}

// ---------------------------------------------------------------------------
// In-page gate pass. Runs the same scripted sequence against the live DOM and
// returns the actual strings for Node-side comparison, plus the parity
// serialization, namespace census, identity verdicts, and layout-read count.

const GATE_SCRIPT = `(() => {
	const SVG_NS = 'http://www.w3.org/2000/svg';
	const HTML_NS = 'http://www.w3.org/1999/xhtml';
	const $ = (sel) => document.querySelector(sel);
	const $$ = (sel) => Array.from(document.querySelectorAll(sel));

	// Layout-read ban: fixtures must position everything from data coordinates.
	let layoutReads = 0;
	const gb = SVGGraphicsElement.prototype.getBBox;
	const gbcr = Element.prototype.getBoundingClientRect;
	SVGGraphicsElement.prototype.getBBox = function () { layoutReads++; return gb.call(this); };
	Element.prototype.getBoundingClientRect = function () { layoutReads++; return gbcr.call(this); };

	const nsCensus = () => {
		const out = { svg: 0, html: 0, other: 0, wrongSvg: [], wrongHtml: [] };
		const root = $('#main');
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
		let el;
		while ((el = walker.nextNode())) {
			let inForeign = false;
			for (let p = el.parentElement; p && p !== root; p = p.parentElement) {
				if (p.localName === 'foreignObject') { inForeign = true; break; }
			}
			if (inForeign) {
				out.html++;
				if (el.namespaceURI !== HTML_NS) out.wrongHtml.push(el.localName);
			} else {
				out.svg++;
				if (el.namespaceURI !== SVG_NS) out.wrongSvg.push(el.localName);
			}
		}
		return out;
	};

	const parity = () => {
		const root = $('#main');
		const lines = [];
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
		let el;
		while ((el = walker.nextNode())) {
			const attrs = [];
			for (const name of el.getAttributeNames()) {
				let value = el.getAttribute(name);
				if (name === 'style') {
					value = value
						.split(';')
						.map((s) => s.trim())
						.filter(Boolean)
						.map((s) => s.replace(/\\s*:\\s*/, ':'))
						.sort()
						.join(';');
				}
				attrs.push(name + '=' + value);
			}
			attrs.sort();
			let text = '';
			for (const child of el.childNodes) {
				if (child.nodeType === Node.TEXT_NODE) text += child.nodeValue;
			}
			if (text.trim() === '') text = '';
			lines.push(el.namespaceURI + '|' + el.localName + '|' + attrs.join('\\u0001') + '|' + text);
		}
		return lines.join('\\n');
	};

	const call = (name, times = 1) => {
		for (let i = 0; i < times; i++) window[name]();
	};

	const actual = {};
	call('__reset');
	call('__mount');

	actual.parityMount = parity();
	actual.nsMount = nsCensus();
	actual.initial = {
		nodes: $$('.nodes > g').length,
		edges: $$('.edges > path').length,
		icons: $$('.icons > .icon').length,
		labeled: $$('.nodes foreignObject').length,
		viewBox: $('svg.dash').getAttribute('viewBox'),
		rootTransform: $('g.root').getAttribute('transform'),
		seriesD: $$('.chart').flatMap((ch) => [
			ch.querySelector('path.area').getAttribute('d'),
			...Array.from(ch.querySelectorAll('.series > path'), (p) => p.getAttribute('d')),
		]),
		nodeTransforms: $$('.nodes > g').map((g) => g.getAttribute('transform')),
		nodeCls: $$('.nodes > g').map((g) => g.getAttribute('class')),
		sparkD: $$('.sparks .spark-line').map((p) => p.getAttribute('d')),
	};
	// SVG class must land as an attribute; className must still be the
	// read-only SVGAnimatedString (nobody wrote the property).
	const probe = $('.nodes > g');
	actual.classIsAttribute =
		typeof probe.className === 'object' && probe.className.baseVal === probe.getAttribute('class');
	actual.overlayIsLast = (() => {
		const rootG = $('g.root');
		return rootG.lastElementChild === $('g.overlay') ||
			$('g.overlay').nextElementSibling === null ||
			// octane leaves portal markers after the overlay; the overlay must at
			// least be the last ELEMENT child.
			Array.from(rootG.children).indexOf($('g.overlay')) === rootG.children.length - 1;
	})();

	call('__tick', 3);
	actual.afterTicks = {
		seriesD: $$('.chart').flatMap((ch) => [
			ch.querySelector('path.area').getAttribute('d'),
			...Array.from(ch.querySelectorAll('.series > path'), (p) => p.getAttribute('d')),
		]),
		legend: $$('.chart').map((ch) =>
			Array.from(ch.querySelectorAll('.legend text'), (t) => t.textContent),
		),
	};

	call('__dragFrame', 2);
	actual.afterDrag = {
		nodeTransforms: $$('.nodes > g').map((g) => g.getAttribute('transform')),
		edgeD: $$('.edges > path').map((p) => p.getAttribute('d')),
		iconTransforms: $$('.icons > .icon').map((g) => g.getAttribute('transform')),
	};

	call('__toggleSelect');
	actual.afterSelect = {
		nodeCls: $$('.nodes > g').map((g) => g.getAttribute('class')),
		edgeCls: $$('.edges > path').map((p) => p.getAttribute('class')),
	};

	// Survivor identity across keyed churn.
	const before = new Map($$('.nodes > g').map((g) => [g.getAttribute('data-id'), g]));
	call('__churnTopology');
	const after = new Map($$('.nodes > g').map((g) => [g.getAttribute('data-id'), g]));
	let identityBroken = 0;
	for (const [id, el2] of after) {
		if (before.has(id) && before.get(id) !== el2) identityBroken++;
	}
	actual.afterChurn = {
		ids: $$('.nodes > g').map((g) => Number(g.getAttribute('data-id'))),
		edgeCount: $$('.edges > path').length,
		labeled: $$('.nodes foreignObject').length,
		identityBroken,
	};

	call('__labelChurn');
	actual.afterLabelChurn = { labeled: $$('.nodes foreignObject').length };

	actual.tooltips = [];
	for (let i = 0; i < 4; i++) {
		call('__tooltipStep');
		const tip = $('g.overlay .tooltip');
		actual.tooltips.push(
			tip === null
				? null
				: {
						transform: tip.getAttribute('transform'),
						title: tip.querySelector('.tt-title').textContent,
						inOverlay: tip.parentElement === $('g.overlay') || $('g.overlay').contains(tip),
					},
		);
	}
	actual.overlayEmptyAfterCycle = $('g.overlay').childElementCount === 0;

	call('__swapIcons');
	actual.afterSwap = {
		iconNames: $$('.icons > .icon > svg').map((s) =>
			s.getAttribute('class').replace('lucide i-', ''),
		),
		hrefs: $$('.nodes > g > use').map((u) => u.getAttribute('href')),
	};

	call('__toggleSeries');
	actual.seriesOffCounts = {
		perChart: $$('.chart').map((ch) => ch.querySelectorAll('.series > path').length),
		yTicks: Array.from($$('.chart')[0].querySelectorAll('.yticks text'), (t) => t.textContent),
	};
	call('__toggleSeries');
	actual.seriesOnCounts = {
		perChart: $$('.chart').map((ch) => ch.querySelectorAll('.series > path').length),
		yTicks: Array.from($$('.chart')[0].querySelectorAll('.yticks text'), (t) => t.textContent),
	};

	call('__pulseEdges');
	const edge0 = $('.edges > path');
	actual.afterPulse = {
		strokeWidth: edge0.style.getPropertyValue('stroke-width'),
		strokeOpacity: edge0.style.getPropertyValue('stroke-opacity'),
		flow: edge0.getAttribute('data-flow'),
	};

	call('__panZoomStep');
	actual.afterPanZoom = {
		viewBox: $('svg.dash').getAttribute('viewBox'),
		rootTransform: $('g.root').getAttribute('transform'),
	};

	actual.finalState = window.__state();
	actual.parityFinal = parity();
	actual.nsFinal = nsCensus();
	actual.layoutReads = layoutReads;

	SVGGraphicsElement.prototype.getBBox = gb;
	Element.prototype.getBoundingClientRect = gbcr;
	return actual;
})()`;

// Deep-compare helper that reports the first few mismatches with context.
function diffInto(failures, target, label, expectedValue, actualValue) {
	const e = JSON.stringify(expectedValue);
	const a = JSON.stringify(actualValue);
	if (e !== a) {
		const at = firstDiff(e, a);
		failures.push(
			`${target}/${label}: expected≠actual around char ${at}: ` +
				`…${e.slice(Math.max(0, at - 40), at + 40)}… vs …${a.slice(Math.max(0, at - 40), at + 40)}…`,
		);
	}
}
function firstDiff(a, b) {
	const n = Math.min(a.length, b.length);
	for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
	return n;
}

function checkGates(target, expected, actual) {
	const failures = [];
	const check = (label, e, a) => diffInto(failures, target, label, e, a);

	check('initial', expected.initial, actual.initial);
	check('ticks.seriesD', expected.afterTicks.seriesD, actual.afterTicks.seriesD);
	check('ticks.legend', expected.afterTicks.legend, actual.afterTicks.legend);
	check('drag.nodeTransforms', expected.afterDrag.nodeTransforms, actual.afterDrag.nodeTransforms);
	check('drag.edgeD', expected.afterDrag.edgeD, actual.afterDrag.edgeD);
	check('drag.iconTransforms', expected.afterDrag.iconTransforms, actual.afterDrag.iconTransforms);
	check('select.nodeCls', expected.afterSelect.nodeCls, actual.afterSelect.nodeCls);
	check('select.edgeCls', expected.afterSelect.edgeCls, actual.afterSelect.edgeCls);
	check('churn.ids', expected.afterChurn.ids, actual.afterChurn.ids);
	check('churn.edgeCount', expected.afterChurn.edgeCount, actual.afterChurn.edgeCount);
	check('churn.labeled', expected.afterChurn.labeled, actual.afterChurn.labeled);
	if (actual.afterChurn.identityBroken > 0) {
		failures.push(
			`${target}/churn.identity: ${actual.afterChurn.identityBroken} surviving keyed nodes were re-created`,
		);
	}
	check('labelChurn.labeled', expected.afterLabelChurn.labeled, actual.afterLabelChurn.labeled);
	for (let i = 0; i < 4; i++) {
		const e = expected.tooltips[i];
		const a = actual.tooltips[i];
		if (e === null) {
			if (a !== null) failures.push(`${target}/tooltip[${i}]: expected closed, found tooltip`);
		} else if (a === null) {
			failures.push(`${target}/tooltip[${i}]: expected open tooltip, found none in overlay`);
		} else {
			if (!a.inOverlay) failures.push(`${target}/tooltip[${i}]: not inside g.overlay`);
			check(`tooltip[${i}].transform`, e.transform, a.transform);
			check(`tooltip[${i}].title`, e.title, a.title);
		}
	}
	if (!actual.overlayEmptyAfterCycle) {
		failures.push(`${target}/tooltip: overlay not empty after close`);
	}
	check('swap.iconNames', expected.afterSwap.iconNames, actual.afterSwap.iconNames);
	check('swap.hrefs', expected.afterSwap.hrefs, actual.afterSwap.hrefs);
	check('seriesOff', expected.seriesOffCounts, actual.seriesOffCounts);
	check('seriesOn', expected.seriesOnCounts, actual.seriesOnCounts);
	check('pulse', expected.afterPulse, actual.afterPulse);
	check('panZoom', expected.afterPanZoom, actual.afterPanZoom);
	check('finalState', expected.finalState, actual.finalState);

	if (!actual.classIsAttribute) {
		failures.push(`${target}/class: SVG class not delivered as attribute (className written?)`);
	}
	if (!actual.overlayIsLast) {
		failures.push(`${target}/overlay: g.overlay is not the last element child of g.root`);
	}
	for (const [label, census] of [
		['mount', actual.nsMount],
		['final', actual.nsFinal],
	]) {
		if (census.wrongSvg.length > 0) {
			failures.push(
				`${target}/namespace(${label}): non-SVG elements outside foreignObject: ` +
					census.wrongSvg.slice(0, 5).join(','),
			);
		}
		if (census.wrongHtml.length > 0) {
			failures.push(
				`${target}/namespace(${label}): non-HTML elements inside foreignObject: ` +
					census.wrongHtml.slice(0, 5).join(','),
			);
		}
	}
	if (actual.layoutReads > 0) {
		failures.push(
			`${target}/layout: ${actual.layoutReads} layout read(s) (getBBox/getBoundingClientRect) during ops`,
		);
	}
	return failures;
}

// ---------------------------------------------------------------------------
// Timed measurement: one fresh page, ops run in declaration order, the whole
// warmup+iteration loop inside one evaluate per op.

async function measureOps(page) {
	const results = {};
	for (const op of OPS) {
		const samples = await page.evaluate(measureSamples, {
			preSrc: op.pre ?? null,
			bodySrc: op.body,
			WARMUP,
			ITER,
			YIELD_MS,
		});
		// Cheap post-op invariant: the dashboard shape survived the loop.
		const shape = await page.evaluate(() => ({
			nodes: document.querySelectorAll('.nodes > g').length,
			edges: document.querySelectorAll('.edges > path').length,
			icons: document.querySelectorAll('.icons > .icon').length,
		}));
		if (shape.nodes !== 150 || shape.edges !== 200 || shape.icons !== 150) {
			throw new Error(
				`${op.name} left ${shape.nodes} nodes / ${shape.edges} edges / ${shape.icons} icons`,
			);
		}
		results[op.name] = summarizeSamples(samples);
	}
	return results;
}

async function freshPage(browser, url, errors) {
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto(url, { waitUntil: 'load' });
	await page.waitForFunction(() => window.__ready === true, null, { timeout: 30_000 });
	await seedRandom(page);
	return { ctx, page };
}

async function runTarget(target, expected) {
	const pageErrors = [];
	const browser = await chromium.launch({
		headless: true,
		args: ['--disable-extensions', '--no-sandbox', '--js-flags=--expose-gc'],
	});
	try {
		// Gate pass on its own page.
		console.error('  → gates');
		const gatePage = await freshPage(browser, target.url, pageErrors);
		let actual;
		try {
			actual = await gatePage.page.evaluate(GATE_SCRIPT);
		} finally {
			await gatePage.ctx.close();
		}
		const failures = checkGates(target.name, expected, actual);
		if (failures.length > 0) return { failures, ops: null, meta: null, parity: null };

		// Census + counters on a pristine mount.
		const censusPage = await freshPage(browser, target.url, pageErrors);
		let census;
		let counters;
		try {
			await censusPage.page.evaluate(() => {
				window.__reset();
				window.__mount();
			});
			census = await censusPage.page.evaluate(censusDomNodes, '#main');
			counters = await censusPage.page.evaluate(() => {
				const SVG_NS = 'http://www.w3.org/2000/svg';
				const HTML_NS = 'http://www.w3.org/1999/xhtml';
				let svg = 0;
				let html = 0;
				const walker = document.createTreeWalker(
					document.querySelector('#main'),
					NodeFilter.SHOW_ELEMENT,
				);
				let el;
				while ((el = walker.nextNode())) {
					if (el.namespaceURI === SVG_NS) svg++;
					else if (el.namespaceURI === HTML_NS) html++;
				}
				return {
					svg,
					html,
					defs: document.querySelectorAll('#main defs > *').length,
				};
			});
		} finally {
			await censusPage.ctx.close();
		}

		// Timed pass on a fresh page.
		const measurePage = await freshPage(browser, target.url, pageErrors);
		let ops;
		try {
			if (!(await measurePage.page.evaluate(() => typeof window.gc === 'function'))) {
				console.error('  ! window.gc unavailable (need --js-flags=--expose-gc) — noisier results');
			}
			console.error('  → ops');
			ops = await measureOps(measurePage.page);
		} finally {
			await measurePage.ctx.close();
		}

		if (pageErrors.length) throw new Error(pageErrors.join('; '));

		ops.nodes_full = deterministicCount(census.total);
		ops.elements_full = deterministicCount(census.elements);
		ops.text_full = deterministicCount(census.text);
		ops.comments_full = deterministicCount(census.comments);
		ops.empty_text_full = deterministicCount(census.emptyText);
		ops.whitespace_text_full = deterministicCount(census.whitespaceText);
		ops.svg_elements_full = deterministicCount(counters.svg);
		ops.foreignobject_html_full = deterministicCount(counters.html);
		ops.defs_full = deterministicCount(counters.defs);

		return {
			failures: [],
			ops,
			meta: { dom: census },
			parity: {
				mount: createHash('md5').update(actual.parityMount).digest('hex'),
				final: createHash('md5').update(actual.parityFinal).digest('hex'),
			},
		};
	} finally {
		await browser.close();
	}
}

// ---------------------------------------------------------------------------

(async () => {
	const failures = sharedFileFailures();
	const expected = failures.length === 0 ? buildExpected() : null;
	const all = {};
	const parities = {};
	const failedTargets = new Set();

	if (failures.length === 0) {
		for (const target of TARGETS) {
			console.error(`Running ${target.name} (${target.url}) × ${ITER} (+${WARMUP} warmup)…`);
			try {
				const result = await runTarget(target, expected);
				if (result.failures.length > 0) {
					failedTargets.add(target.name);
					for (const failure of result.failures) {
						failures.push(failure);
						console.error(`  ✗ ${failure}`);
					}
					continue;
				}
				all[target.name] = result;
				parities[target.name] = result.parity;
			} catch (error) {
				failedTargets.add(target.name);
				const message = `${target.name}: ${error instanceof Error ? error.message : String(error)}`;
				failures.push(message);
				console.error(`  ✗ ${message}`);
			}
			await sleep(100);
		}

		// Cross-flavor parity: the canonical DOM serialization must hash
		// identically for every fixture, at mount and after the gate sequence.
		const names = Object.keys(parities);
		for (const phase of ['mount', 'final']) {
			const hashes = new Set(names.map((n) => parities[n][phase]));
			if (names.length > 1 && hashes.size !== 1) {
				failures.push(
					`DOM parity (${phase}) diverged: ` +
						names.map((n) => `${n}=${parities[n][phase].slice(0, 8)}`).join(' '),
				);
			}
		}
	} else {
		for (const failure of failures) console.error(`✗ ${failure}`);
	}

	const timedOps = OPS.map((op) => op.name);
	const cols = TARGETS.filter((t) => all[t.name]).map((t) => t.name);
	if (cols.length > 0) {
		const W = 30;
		console.log();
		console.log('Op                  | ' + cols.map((c) => c.padEnd(W)).join('| '));
		console.log('--------------------+-' + cols.map(() => '-'.repeat(W)).join('+-'));
		for (const op of timedOps) {
			const row = [op.padEnd(19)];
			for (const c of cols) {
				const r = all[c].ops[op];
				row.push(
					`${r.median.toFixed(2)} (min ${r.min.toFixed(2)}, sd ${r.stddev.toFixed(2)})`.padEnd(W),
				);
			}
			console.log(row.join('| '));
		}
		if (cols.includes('octane-tsrx') && cols.length > 1) {
			console.log();
			for (const c of cols) {
				if (c === 'octane-tsrx') continue;
				console.log(`octane-tsrx / ${c} ratio (score; <1 means octane faster):`);
				for (const op of timedOps) {
					const ratio = scoreOf(all['octane-tsrx'].ops[op]) / scoreOf(all[c].ops[op]);
					const tag = ratio < 0.95 ? '++ faster' : ratio < 1.05 ? '== ~equal' : '-- slower';
					console.log(`  ${op.padEnd(19)} ${ratio.toFixed(2)}x  ${tag}`);
				}
				console.log();
			}
		}
	}

	if (process.env.BENCH_JSON) {
		const payload = {
			suite: 'svg-dashboard',
			iterations: ITER,
			targets: TARGETS.map((t) => ({
				name: t.name,
				ops: all[t.name]
					? Object.fromEntries(
							Object.entries(all[t.name].ops).map(([name, stat]) => [
								name,
								timedOps.includes(name) ? timingStatForJson(stat) : deterministicStatForJson(stat),
							]),
						)
					: {},
				meta: {
					...(all[t.name]?.meta ?? {}),
					gates: failedTargets.has(t.name) ? 'fail' : 'pass',
					parity: parities[t.name] ?? null,
				},
			})),
		};
		if (failures.length > 0) payload.failed = failures.join('; ');
		writeFileSync(process.env.BENCH_JSON, JSON.stringify(payload, null, '\t') + '\n');
		console.error(`BENCH_JSON written to ${process.env.BENCH_JSON}`);
	}

	if (failures.length > 0) {
		console.error(`\n✗ ${failures.length} failure(s):`);
		for (const failure of failures) console.error(`  - ${failure}`);
		process.exitCode = 1;
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
