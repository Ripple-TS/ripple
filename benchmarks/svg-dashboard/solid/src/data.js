// svg-dashboard shared dataset — pure, deterministic constants and string
// builders. Every byte that reaches the DOM (path `d`, `transform`, class,
// style values, labels) is produced HERE, so all four framework fixtures render
// byte-identical SVG from identical state and the harness can recompute the
// expected strings in Node. No Math.random, no Date, no layout reads.
//
// Copied verbatim into each app's src/ (the harness md5-gates the copies).

export const NODE_COUNT = 150;
export const EDGE_COUNT = 200;
export const CHART_COUNT = 8;
export const SERIES_PER_CHART = 5;
export const POINTS = 120;
export const X_TICKS = 6;
export const Y_TICKS = 4;
export const SPARK_COUNT = 32;
export const SPARK_POINTS = 40;

export const SYMBOLS = ['ok', 'warn', 'err'];
export const ZONES = ['core', 'edge', 'data', 'jobs'];
export const EDGE_KINDS = ['grpc', 'http', 'queue'];
export const SERIES_NAMES = ['p50', 'p95', 'p99', 'rps', 'err'];

// Op shape constants (how much each rotational op touches).
export const DRAG_COUNT = 10;
export const SELECT_COUNT = 40;
export const CHURN_COUNT = 30;
export const LABEL_ROTATE = 60;

// Canvas geometry. Topology occupies the left block, the charts strip the
// right column, sparklines the lower-left band. All coordinates are baked into
// strings via fmt() so no flavor ever formats a number itself.
export const VIEW_W = 1200;
export const VIEW_H = 800;
export const CHART_X = 760;
export const CHART_TOP = 8;
export const CHART_STEP = 98; // per-chart vertical pitch
export const CHART_W = 430;
export const CHART_H = 92;
export const PLOT_X = 36;
export const PLOT_Y = 10;
export const PLOT_W = 380;
export const PLOT_H = 64;
export const SPARK_X0 = 40;
export const SPARK_Y0 = 566;
export const SPARK_W = 80;
export const SPARK_H = 40;

// mulberry32 — the same deterministic PRNG the sibling suites use (dbmon
// data.js, js-framework's seedRandom patch). Same seed → same sequence.
export function rng(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// THE number formatter. Two decimals, trailing zeros trimmed, no negative
// zero. Every coordinate that reaches a DOM string goes through fmt() so the
// byte-exact gates hold across flavors and Node.
export function fmt(n) {
	let s = n.toFixed(2);
	if (s.indexOf('.') !== -1) {
		let end = s.length;
		while (s.charCodeAt(end - 1) === 48) end--; // '0'
		if (s.charCodeAt(end - 1) === 46) end--; // '.'
		s = s.slice(0, end);
	}
	return s === '-0' ? '0' : s;
}

export function nodeTransform(x, y) {
	return 'translate(' + fmt(x) + ' ' + fmt(y) + ')';
}

// Edge curve between two node centres — a shallow cubic bow. Pure function of
// the endpoint coordinates.
export function edgePath(ax, ay, bx, by) {
	const third = (bx - ax) / 3;
	return (
		'M' +
		fmt(ax) +
		' ' +
		fmt(ay) +
		' C' +
		fmt(ax + third) +
		' ' +
		fmt(ay - 14) +
		' ' +
		fmt(bx - third) +
		' ' +
		fmt(by + 14) +
		' ' +
		fmt(bx) +
		' ' +
		fmt(by)
	);
}

// Class-string builders — PRE-JOINED single strings, never arrays: Octane
// clsx-composes arrays while React coerces them to "a,b", so composition here
// is the only portable form.
export function nodeClass(zone, symbol, selected) {
	return 'node z-' + zone + ' st-' + symbol + (selected ? ' selected' : '');
}
export function edgeClass(kind, active) {
	return 'edge k-' + kind + (active ? ' active' : '');
}

// Lucide-style icon descriptors: [tag, attrs][] per variant, attrs keyed by
// FINAL DOM attribute names so they can flow through createElement/spread in
// every flavor without any aliasing step. The ok→warn and warn→err rotations
// change the tag sequence (element replacement); err→ok patches attrs only.
export const ICONS = {
	ok: [
		['circle', { cx: '12', cy: '12', r: '9' }],
		['path', { d: 'M8 12.5l2.5 2.5L16 9' }],
	],
	warn: [
		['path', { d: 'M12 3 2 21h20L12 3z' }],
		['line', { x1: '12', y1: '10', x2: '12', y2: '15' }],
	],
	err: [
		['circle', { cx: '12', cy: '12', r: '9' }],
		['path', { d: 'M9 9l6 6m0-6l-6 6' }],
	],
};

// The outer icon <svg> attributes (lucide defaultAttributes shape, minus
// xmlns — these render inside an SVG document). `class` is separate because
// React's builder must map it to className.
export const ICON_SVG_ATTRS = {
	width: '16',
	height: '16',
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	'stroke-width': '2',
	'stroke-linecap': 'round',
	'stroke-linejoin': 'round',
};
export const ICON_SVG_CLASS = 'lucide';

// Eight preset pan/zoom states — consecutive states always differ in both the
// viewBox and the root transform, so every __panZoomStep writes both.
export const PAN_ZOOM_STATES = [];
for (let i = 0; i < 8; i++) {
	PAN_ZOOM_STATES.push({
		viewBox:
			fmt(i * 7) + ' ' + fmt(i * 4) + ' ' + fmt(VIEW_W - i * 40) + ' ' + fmt(VIEW_H - i * 26),
		rootTransform: 'translate(' + fmt(-i * 6) + ' ' + fmt(-i * 3) + ')',
	});
}

// Static per-index chart geometry strings.
export const CHART_TRANSFORMS = [];
for (let c = 0; c < CHART_COUNT; c++) {
	CHART_TRANSFORMS.push('translate(' + fmt(CHART_X) + ' ' + fmt(CHART_TOP + c * CHART_STEP) + ')');
}
export const X_TICK_TRANSFORMS = [];
export const X_TICK_XS = [];
for (let i = 0; i < X_TICKS; i++) {
	const x = PLOT_X + (i * PLOT_W) / (X_TICKS - 1);
	X_TICK_XS.push(x);
	X_TICK_TRANSFORMS.push('translate(' + fmt(x) + ' ' + fmt(PLOT_Y + PLOT_H) + ')');
}
export const Y_TICK_TRANSFORMS = [];
for (let i = 0; i < Y_TICKS; i++) {
	Y_TICK_TRANSFORMS.push(
		'translate(' + fmt(PLOT_X) + ' ' + fmt(PLOT_Y + PLOT_H - ((i + 1) * PLOT_H) / Y_TICKS) + ')',
	);
}
export const LEGEND_TRANSFORMS = [];
for (let i = 0; i < SERIES_PER_CHART; i++) {
	LEGEND_TRANSFORMS.push('translate(' + fmt(PLOT_X + i * 76) + ' ' + fmt(CHART_H - 4) + ')');
}
export const SPARK_TRANSFORMS = [];
for (let i = 0; i < SPARK_COUNT; i++) {
	const col = i % 8;
	const row = (i / 8) | 0;
	SPARK_TRANSFORMS.push(
		'translate(' + fmt(SPARK_X0 + col * 88) + ' ' + fmt(SPARK_Y0 + row * 58) + ')',
	);
}

// Precomputed x-coordinate strings for chart/spark polyline points — only the
// values move on a tick, so the x side of every point is a constant.
export const CHART_XS = [];
for (let i = 0; i < POINTS; i++) {
	CHART_XS.push(fmt(PLOT_X + (i * PLOT_W) / (POINTS - 1)));
}
export const SPARK_XS = [];
for (let i = 0; i < SPARK_POINTS; i++) {
	SPARK_XS.push(fmt((i * SPARK_W) / (SPARK_POINTS - 1)));
}

// Value band per series: series s random-walks inside (0, 20*(s+1)), so the y
// domain is a pure function of which series are enabled (all 5 → 100, the
// first 3 → 60). Toggling series rescales every surviving path — that IS the
// series_toggle workload.
export function seriesBand(s) {
	return 20 * (s + 1);
}
export function yMaxFor(enabledCount) {
	return 20 * enabledCount;
}

// The topology generator: a jittered grid of NODE_COUNT services plus
// EDGE_COUNT short-range links. Pure function of the stream passed in.
export function makeTopology(rand) {
	const nodes = [];
	for (let i = 0; i < NODE_COUNT; i++) {
		const col = i % 15;
		const row = (i / 15) | 0;
		const zone = ZONES[(col >= 8 ? 1 : 0) + (row >= 5 ? 2 : 0)];
		const r = rand();
		const symIdx = r < 0.7 ? 0 : r < 0.9 ? 1 : 2;
		nodes.push({
			id: i,
			x: 40 + col * 48 + (rand() - 0.5) * 24,
			y: 40 + row * 52 + (rand() - 0.5) * 24,
			zone,
			symIdx,
			labeled: i % 5 !== 4,
			name: zone + '-' + i,
		});
	}
	const edges = [];
	for (let j = 0; j < EDGE_COUNT; j++) {
		const a = (rand() * NODE_COUNT) | 0;
		const b = (a + 1 + ((rand() * 20) | 0)) % NODE_COUNT;
		edges.push({
			id: 'e' + j,
			a: nodes[a].id,
			b: nodes[b].id,
			kind: EDGE_KINDS[(rand() * EDGE_KINDS.length) | 0],
		});
	}
	return { nodes, edges };
}
