// svg-dashboard shared op driver — framework-agnostic. Each App binds its
// three domain setters via bindSetters() on mount; window hooks in main.*
// wrap the exported ops in the framework's synchronous flush. All state lives
// here at module scope, so a timed op is "recompute the affected rows, call
// the setter with a fresh snapshot".
//
// Row discipline: snapshot rows are plain objects whose DOM-bound values are
// FINAL strings (d, transform, class, style values, labels). Rows untouched by
// an op are reused by reference, so each framework's diff-skip machinery is
// what gets measured; ops that deliberately touch everything (select, pulse,
// swapIcons) rebuild every row. tickSparse is the exception: it publishes
// fresh-but-value-identical rows so the frameworks walk a full re-render in
// which almost nothing changed.
//
// Copied verbatim into each app's src/ (the harness md5-gates the copies).

import {
	CHART_COUNT,
	CHART_TRANSFORMS,
	CHART_XS,
	CHURN_COUNT,
	DRAG_COUNT,
	EDGE_KINDS,
	ICONS,
	LABEL_ROTATE,
	LEGEND_TRANSFORMS,
	PAN_ZOOM_STATES,
	PLOT_H,
	PLOT_X,
	PLOT_Y,
	PLOT_W,
	POINTS,
	SELECT_COUNT,
	SERIES_NAMES,
	SERIES_PER_CHART,
	SPARK_COUNT,
	SPARK_H,
	SPARK_POINTS,
	SPARK_TRANSFORMS,
	SPARK_XS,
	SYMBOLS,
	X_TICKS,
	X_TICK_TRANSFORMS,
	Y_TICKS,
	Y_TICK_TRANSFORMS,
	ZONES,
	edgeClass,
	edgePath,
	fmt,
	makeTopology,
	nodeClass,
	nodeTransform,
	rng,
	seriesBand,
	yMaxFor,
} from './data.js';

let _setTopo = null;
let _setCharts = null;
let _setUi = null;

// Partial merge: a fixture may bind each domain from the component that
// owns that domain's state (e.g. ui from a viewport leaf component).
export function bindSetters(s) {
	if (s.setTopo) _setTopo = s.setTopo;
	if (s.setCharts) _setCharts = s.setCharts;
	if (s.setUi) _setUi = s.setUi;
}

// ---------------------------------------------------------------------------
// Base state + snapshot row caches (all initialized by reset()).

let _nodes; // base node records (mutable x/y/labeled), parallel to _nodeRows
let _edges; // base edge records {id, a, b, kind}, parallel to _edgeRows
let _nodeRows; // [{id, cls, transform, href, labeled, labelText, attrs}]
let _edgeRows; // [{id, cls, d, style, styleKebab, attrs}]
let _iconRows; // [{id, transform, name}] parallel to _nodes
let _chartRows; // [{id, transform, gradId, areaFill, areaD, stops, series, xTicks, yTicks, legend}]
let _sparkRows; // [{id, transform, d, cx, cy}]
let _viewBox;
let _rootTransform;
let _tooltip;

let _rings; // [c][s] -> {v: Float64Array, y: string[], head}
let _sparkRings; // [i] -> {v, y, head}
let _yMax;
let _seriesOff;

let _frame;
let _selected; // Set of selected node ids
let _selPos; // rotating selection window position
let _dragStep;
let _panStep;
let _tooltipStep;
let _iconEpoch;
let _pulse;
let _labelPos;
let _churnRound;
let _idBase;
let _edgeIdBase;
let _tickRand; // stream for tick value walks
let _churnRand; // stream for churn placement/kinds

// Fixed drag targets (positions in the current node order) and a zero-sum
// wave so dragged nodes oscillate instead of walking off-canvas.
const DRAG_POS = [3, 17, 31, 45, 59, 73, 87, 101, 115, 129];
const DRAG_WAVE = [4, 3, -2, -5, -4, -3, 2, 5];
const TOOLTIP_POS = [5, 45, 90];

export function reset() {
	const topoRand = rng(11);
	_tickRand = rng(37);
	_churnRand = rng(53);

	const t = makeTopology(topoRand);
	_nodes = t.nodes;
	_edges = t.edges;

	_frame = 0;
	_selected = new Set();
	_selPos = 0;
	_dragStep = 0;
	_panStep = 0;
	_tooltipStep = 0;
	_iconEpoch = 0;
	_pulse = 0;
	_labelPos = 0;
	_churnRound = 0;
	_idBase = _nodes.length;
	_edgeIdBase = _edges.length;
	_seriesOff = false;
	_yMax = yMaxFor(SERIES_PER_CHART);
	_viewBox = PAN_ZOOM_STATES[0].viewBox;
	_rootTransform = PAN_ZOOM_STATES[0].rootTransform;
	_tooltip = null;

	const chartRand = rng(23);
	_rings = [];
	for (let c = 0; c < CHART_COUNT; c++) {
		const perChart = [];
		for (let s = 0; s < SERIES_PER_CHART; s++) {
			const band = seriesBand(s);
			const v = new Float64Array(POINTS);
			let cur = band * (0.3 + chartRand() * 0.4);
			for (let i = 0; i < POINTS; i++) {
				cur = walk(cur, band, chartRand);
				v[i] = cur;
			}
			perChart.push({ v, y: null, head: 0 });
		}
		_rings.push(perChart);
	}
	rebuildAllYStrings();

	_sparkRings = [];
	for (let i = 0; i < SPARK_COUNT; i++) {
		const v = new Float64Array(SPARK_POINTS);
		const y = new Array(SPARK_POINTS);
		let cur = 6 + chartRand() * 8;
		for (let p = 0; p < SPARK_POINTS; p++) {
			cur = walk(cur, 20, chartRand);
			v[p] = cur;
			y[p] = sparkY(cur);
		}
		_sparkRings.push({ v, y, head: 0 });
	}

	_nodeRows = _nodes.map(buildNodeRow);
	_edgeRows = _edges.map(buildEdgeRow);
	_iconRows = _nodes.map(buildIconRow);
	_chartRows = [];
	for (let c = 0; c < CHART_COUNT; c++) _chartRows.push(buildChartRow(c));
	_sparkRows = [];
	for (let i = 0; i < SPARK_COUNT; i++) _sparkRows.push(buildSparkRow(i));
}

function walk(cur, band, rand) {
	let next = cur + (rand() - 0.5) * 6;
	if (next < 1) next = 1 + (1 - next) * 0.25;
	if (next > band - 1) next = band - 1 - (next - (band - 1)) * 0.25;
	return next;
}

function chartY(v) {
	return fmt(PLOT_Y + PLOT_H - (v / _yMax) * PLOT_H);
}
function sparkY(v) {
	return fmt(SPARK_H - (v / 20) * SPARK_H);
}

function rebuildAllYStrings() {
	for (let c = 0; c < CHART_COUNT; c++) {
		for (let s = 0; s < SERIES_PER_CHART; s++) {
			const ring = _rings[c][s];
			const y = new Array(POINTS);
			for (let i = 0; i < POINTS; i++) y[i] = chartY(ring.v[i]);
			ring.y = y;
		}
	}
}

// ---------------------------------------------------------------------------
// Row builders. Every DOM-bound value is a final string.

function displaySymbol(symIdx) {
	return SYMBOLS[(symIdx + _iconEpoch) % SYMBOLS.length];
}

function buildNodeRow(n) {
	const sym = displaySymbol(n.symIdx);
	return {
		id: n.id,
		cls: nodeClass(n.zone, SYMBOLS[n.symIdx], _selected.has(n.id)),
		transform: nodeTransform(n.x, n.y),
		href: '#sym-' + sym,
		labeled: n.labeled,
		labelText: n.name,
		attrs: { 'data-id': String(n.id), 'data-zone': n.zone, 'data-status': SYMBOLS[n.symIdx] },
	};
}

function nodeById(id) {
	for (let i = 0; i < _nodes.length; i++) if (_nodes[i].id === id) return _nodes[i];
	throw new Error('missing node ' + id);
}

function edgeStyleStrings() {
	return {
		strokeWidth: fmt(1 + (_pulse % 4) * 0.5),
		strokeOpacity: fmt(0.4 + (_pulse % 3) * 0.2),
	};
}

function buildEdgeRow(e) {
	const a = nodeById(e.a);
	const b = nodeById(e.b);
	const s = edgeStyleStrings();
	return {
		id: e.id,
		cls: edgeClass(e.kind, _selected.has(e.a) || _selected.has(e.b)),
		d: edgePath(a.x, a.y, b.x, b.y),
		style: { strokeWidth: s.strokeWidth, strokeOpacity: s.strokeOpacity },
		styleKebab: { 'stroke-width': s.strokeWidth, 'stroke-opacity': s.strokeOpacity },
		attrs: { 'data-kind': e.kind, 'data-flow': 'f' + (_pulse % 8) },
	};
}

function buildIconRow(n) {
	return {
		id: n.id,
		transform: nodeTransform(n.x + 18, n.y - 22),
		name: displaySymbol(n.symIdx),
	};
}

function seriesEnabled() {
	return _seriesOff ? 3 : SERIES_PER_CHART;
}

function buildLineD(ring) {
	const y = ring.y;
	const head = ring.head;
	let d = 'M' + CHART_XS[0] + ' ' + y[head % POINTS];
	for (let i = 1; i < POINTS; i++) {
		d += ' L' + CHART_XS[i] + ' ' + y[(head + i) % POINTS];
	}
	return d;
}

const AREA_CLOSE =
	' L' +
	CHART_XS[POINTS - 1] +
	' ' +
	fmt(PLOT_Y + PLOT_H) +
	' L' +
	CHART_XS[0] +
	' ' +
	fmt(PLOT_Y + PLOT_H) +
	' Z';

function latestOf(ring) {
	return ring.v[(ring.head + POINTS - 1) % POINTS];
}

function xTickLabel(i) {
	return '+' + (_frame + i * 20) + 's';
}

function buildChartRow(c) {
	const rings = _rings[c];
	const enabled = seriesEnabled();
	const series = [];
	for (let s = 0; s < enabled; s++) {
		series.push({
			id: 'c' + c + 's' + s,
			cls: 'series s-' + s,
			lineD: buildLineD(rings[s]),
		});
	}
	const xTicks = [];
	for (let i = 0; i < X_TICKS; i++) {
		xTicks.push({ id: 'x' + i, transform: X_TICK_TRANSFORMS[i], label: xTickLabel(i) });
	}
	const yTicks = [];
	for (let i = 0; i < Y_TICKS; i++) {
		yTicks.push({
			id: 'y' + i,
			transform: Y_TICK_TRANSFORMS[i],
			label: fmt((_yMax * (i + 1)) / Y_TICKS),
		});
	}
	const legend = [];
	for (let s = 0; s < enabled; s++) {
		legend.push({
			id: 'l' + s,
			transform: LEGEND_TRANSFORMS[s],
			swatch: 'swatch s-' + s,
			label: SERIES_NAMES[s] + ' ' + fmt(latestOf(rings[s])),
		});
	}
	const stops = [
		{ id: 'st0', off: '0%', color: '#1d4ed8', opacity: stopOpacity(c, 0) },
		{ id: 'st1', off: '55%', color: '#1e40af', opacity: stopOpacity(c, 1) },
		{ id: 'st2', off: '100%', color: '#0b0e14', opacity: stopOpacity(c, 2) },
	];
	return {
		id: 'c' + c,
		transform: CHART_TRANSFORMS[c],
		gradId: 'grad-' + c,
		areaFill: 'url(#grad-' + c + ')',
		areaD: buildLineD(rings[0]) + AREA_CLOSE,
		stops,
		series,
		xTicks,
		yTicks,
		legend,
	};
}

function stopOpacity(c, i) {
	return fmt(0.1 + 0.05 * ((_frame + c + i) % 5));
}

function buildSparkRow(i) {
	const ring = _sparkRings[i];
	const y = ring.y;
	const head = ring.head;
	let d = 'M' + SPARK_XS[0] + ' ' + y[head % SPARK_POINTS];
	for (let p = 1; p < SPARK_POINTS; p++) {
		d += ' L' + SPARK_XS[p] + ' ' + y[(head + p) % SPARK_POINTS];
	}
	return {
		id: 'sp' + i,
		transform: SPARK_TRANSFORMS[i],
		d,
		cx: SPARK_XS[SPARK_POINTS - 1],
		cy: y[(head + SPARK_POINTS - 1) % SPARK_POINTS],
	};
}

// Fresh-but-value-identical clones for tickSparse: new row/child objects, the
// same strings. String equality (not identity) is what the frameworks' guards
// compare, so these rows re-render "for nothing".
function cloneChartRow(row) {
	return {
		...row,
		stops: row.stops.map((s) => ({ ...s })),
		series: row.series.map((s) => ({ ...s })),
		xTicks: row.xTicks.map((t) => ({ ...t })),
		yTicks: row.yTicks.map((t) => ({ ...t })),
		legend: row.legend.map((l) => ({ ...l })),
	};
}

// ---------------------------------------------------------------------------
// Snapshots + commits. Fresh top-level containers each commit; row reuse is
// the per-op contract described above.

function topoSnapshot() {
	return { nodes: _nodeRows.slice(), edges: _edgeRows.slice(), icons: _iconRows.slice() };
}
function chartsSnapshot() {
	return { charts: _chartRows.slice(), sparks: _sparkRows.slice() };
}
function uiSnapshot() {
	return { viewBox: _viewBox, rootTransform: _rootTransform, tooltip: _tooltip };
}

function commitTopo() {
	if (_setTopo) _setTopo(topoSnapshot());
}
function commitCharts() {
	if (_setCharts) _setCharts(chartsSnapshot());
}
function commitUi() {
	if (_setUi) _setUi(uiSnapshot());
}

export function initialTopo() {
	return topoSnapshot();
}
export function initialCharts() {
	return chartsSnapshot();
}
export function initialUi() {
	return uiSnapshot();
}

// ---------------------------------------------------------------------------
// Ops — all zero-arg and rotational so the harness can call them repeatedly.

// Full stream frame: every chart series advances one point (ring shift + one
// new value), every sparkline advances, x-axis labels shift, legend values and
// gradient stop opacities update.
export function tick() {
	_frame++;
	for (let c = 0; c < CHART_COUNT; c++) {
		for (let s = 0; s < seriesEnabled(); s++) {
			advanceRing(_rings[c][s], seriesBand(s), chartY);
		}
		_chartRows[c] = buildChartRow(c);
	}
	for (let i = 0; i < SPARK_COUNT; i++) {
		advanceRing(_sparkRings[i], 20, sparkY, SPARK_POINTS);
		_sparkRows[i] = buildSparkRow(i);
	}
	commitCharts();
}

function advanceRing(ring, band, toY, len = POINTS) {
	const idx = ring.head % len;
	const prev = ring.v[(ring.head + len - 1) % len];
	const next = walk(prev, band, _tickRand);
	ring.v[idx] = next;
	ring.y[idx] = toY(next);
	ring.head = (ring.head + 1) % len;
}

// Sparse frame: ONLY chart 0 / series 0 advances; every other chart, series,
// tick, legend entry, and sparkline is republished as a fresh object with
// identical strings. Measures the diff-skip walk across the whole strip.
export function tickSparse() {
	advanceRing(_rings[0][0], seriesBand(0), chartY);
	for (let c = 0; c < CHART_COUNT; c++) {
		_chartRows[c] = cloneChartRow(_chartRows[c]);
	}
	const c0 = _chartRows[0];
	c0.areaD = buildLineD(_rings[0][0]) + AREA_CLOSE;
	c0.series[0] = { ...c0.series[0], lineD: buildLineD(_rings[0][0]) };
	c0.legend[0] = {
		...c0.legend[0],
		label: SERIES_NAMES[0] + ' ' + fmt(latestOf(_rings[0][0])),
	};
	for (let i = 0; i < SPARK_COUNT; i++) {
		_sparkRows[i] = { ..._sparkRows[i] };
	}
	commitCharts();
}

// One drag frame: the ten DRAG_POS nodes move along the zero-sum wave; their
// node + icon transforms and every incident edge's d rebuild.
export function dragFrame() {
	_dragStep++;
	const wave = DRAG_WAVE[_dragStep % DRAG_WAVE.length];
	const moved = new Set();
	for (let k = 0; k < DRAG_COUNT; k++) {
		const pos = DRAG_POS[k] % _nodes.length;
		const n = _nodes[pos];
		n.x += wave * (1 + (k % 3) * 0.5);
		n.y += wave * (k % 2 === 0 ? 0.8 : -0.8);
		moved.add(n.id);
		const row = _nodeRows[pos];
		_nodeRows[pos] = { ...row, transform: nodeTransform(n.x, n.y) };
		_iconRows[pos] = { ..._iconRows[pos], transform: nodeTransform(n.x + 18, n.y - 22) };
	}
	for (let j = 0; j < _edges.length; j++) {
		const e = _edges[j];
		if (moved.has(e.a) || moved.has(e.b)) {
			const a = nodeById(e.a);
			const b = nodeById(e.b);
			_edgeRows[j] = { ..._edgeRows[j], d: edgePath(a.x, a.y, b.x, b.y) };
		}
	}
	commitTopo();
}

// One pan/zoom commit: viewBox + root transform move to the next preset.
export function panZoomStep() {
	_panStep++;
	const s = PAN_ZOOM_STATES[_panStep % PAN_ZOOM_STATES.length];
	_viewBox = s.viewBox;
	_rootTransform = s.rootTransform;
	commitUi();
}

// Rotate the selection window: every node and edge class string recomputes.
export function toggleSelect() {
	_selPos = (_selPos + SELECT_COUNT) % _nodes.length;
	_selected = new Set();
	for (let k = 0; k < SELECT_COUNT; k++) {
		_selected.add(_nodes[(_selPos + k) % _nodes.length].id);
	}
	for (let i = 0; i < _nodes.length; i++) {
		const n = _nodes[i];
		_nodeRows[i] = {
			..._nodeRows[i],
			cls: nodeClass(n.zone, SYMBOLS[n.symIdx], _selected.has(n.id)),
		};
	}
	for (let j = 0; j < _edges.length; j++) {
		const e = _edges[j];
		_edgeRows[j] = {
			..._edgeRows[j],
			cls: edgeClass(e.kind, _selected.has(e.a) || _selected.has(e.b)),
		};
	}
	commitTopo();
}

// One keyed churn commit: CHURN_COUNT nodes (a contiguous window of the
// current order) leave with their incident edges; the same number of fresh
// nodes arrive with new ids, and replacement edges attach them to survivors.
// The survivor order then rotates so the reconciler must move keyed rows.
export function churnTopology() {
	_churnRound++;
	const len = _nodes.length;
	const start = (_churnRound * 37) % len;
	const removedIds = new Set();
	const removePos = [];
	for (let k = 0; k < CHURN_COUNT; k++) {
		const pos = (start + k) % len;
		removePos.push(pos);
		removedIds.add(_nodes[pos].id);
	}
	removePos.sort((a, b) => b - a);
	for (const pos of removePos) {
		_nodes.splice(pos, 1);
		_nodeRows.splice(pos, 1);
		_iconRows.splice(pos, 1);
	}
	let removedEdges = 0;
	for (let j = _edges.length - 1; j >= 0; j--) {
		const e = _edges[j];
		if (removedIds.has(e.a) || removedIds.has(e.b)) {
			_edges.splice(j, 1);
			_edgeRows.splice(j, 1);
			removedEdges++;
		}
	}
	const freshNodes = [];
	for (let k = 0; k < CHURN_COUNT; k++) {
		const id = _idBase++;
		const zone = ZONES[(_churnRand() * ZONES.length) | 0];
		const r = _churnRand();
		const n = {
			id,
			x: 60 + _churnRand() * 640,
			y: 60 + _churnRand() * 460,
			zone,
			symIdx: r < 0.7 ? 0 : r < 0.9 ? 1 : 2,
			labeled: id % 5 !== 4,
			name: zone + '-' + id,
		};
		freshNodes.push(n);
		const pos = (start + k * 3) % (_nodes.length + 1);
		_nodes.splice(pos, 0, n);
		_nodeRows.splice(pos, 0, buildNodeRow(n));
		_iconRows.splice(pos, 0, buildIconRow(n));
	}
	for (let k = 0; k < removedEdges; k++) {
		const fresh = freshNodes[k % freshNodes.length];
		const other = _nodes[(_churnRand() * _nodes.length) | 0];
		const e = {
			id: 'e' + _edgeIdBase++,
			a: fresh.id,
			b: other.id === fresh.id ? _nodes[0].id : other.id,
			kind: EDGE_KINDS[(_churnRand() * EDGE_KINDS.length) | 0],
		};
		_edges.push(e);
		_edgeRows.push(buildEdgeRow(e));
	}
	rotateInPlace(_nodes, 17);
	rotateInPlace(_nodeRows, 17);
	rotateInPlace(_iconRows, 17);
	rotateInPlace(_edges, 11);
	rotateInPlace(_edgeRows, 11);
	commitTopo();
}

function rotateInPlace(arr, by) {
	const cut = arr.splice(0, by % arr.length);
	for (const item of cut) arr.push(item);
}

// Rotate which nodes carry a foreignObject label: LABEL_ROTATE nodes flip.
export function labelChurn() {
	const len = _nodes.length;
	for (let k = 0; k < LABEL_ROTATE; k++) {
		const pos = (_labelPos + k) % len;
		const n = _nodes[pos];
		n.labeled = !n.labeled;
		_nodeRows[pos] = { ..._nodeRows[pos], labeled: n.labeled };
	}
	_labelPos = (_labelPos + LABEL_ROTATE) % len;
	commitTopo();
}

// Advance the 4-state tooltip machine: closed → node A → node B → node C → closed.
export function tooltipStep() {
	_tooltipStep = (_tooltipStep + 1) % 4;
	if (_tooltipStep === 0) {
		_tooltip = null;
	} else {
		const pos = TOOLTIP_POS[_tooltipStep - 1] % _nodes.length;
		const n = _nodes[pos];
		let degree = 0;
		for (const e of _edges) if (e.a === n.id || e.b === n.id) degree++;
		_tooltip = {
			id: n.id,
			transform: nodeTransform(n.x + 24, n.y - 30),
			title: n.name,
			l1: 'zone ' + n.zone,
			l2: 'deg ' + degree,
		};
	}
	commitUi();
}

// Rotate every node's DISPLAYED status: all 150 createElement-built icons
// re-diff (ok→warn and warn→err swap tags; err→ok patches attrs) and every
// node's <use href> rewrites on the compiled fast path.
export function swapIcons() {
	_iconEpoch++;
	for (let i = 0; i < _nodes.length; i++) {
		const n = _nodes[i];
		const sym = displaySymbol(n.symIdx);
		_iconRows[i] = { ..._iconRows[i], name: sym };
		_nodeRows[i] = { ..._nodeRows[i], href: '#sym-' + sym };
	}
	commitTopo();
}

// Hide the last two series of every chart (or restore them): the y domain
// rescales, so every surviving path and y-tick label rebuilds.
export function toggleSeries() {
	_seriesOff = !_seriesOff;
	_yMax = yMaxFor(seriesEnabled());
	rebuildAllYStrings();
	for (let c = 0; c < CHART_COUNT; c++) {
		_chartRows[c] = buildChartRow(c);
	}
	commitCharts();
}

// Pulse the stroke style + data-flow spread bag on every edge; class and d
// strings are reused so ONLY the style/spread machinery runs.
export function pulseEdges() {
	_pulse++;
	const s = edgeStyleStrings();
	const flow = 'f' + (_pulse % 8);
	for (let j = 0; j < _edges.length; j++) {
		const e = _edges[j];
		_edgeRows[j] = {
			..._edgeRows[j],
			style: { strokeWidth: s.strokeWidth, strokeOpacity: s.strokeOpacity },
			styleKebab: { 'stroke-width': s.strokeWidth, 'stroke-opacity': s.strokeOpacity },
			attrs: { 'data-kind': e.kind, 'data-flow': flow },
		};
	}
	commitTopo();
}

// ---------------------------------------------------------------------------
// Introspection for the harness (untimed).

export function currentState() {
	let labeled = 0;
	for (const n of _nodes) if (n.labeled) labeled++;
	return {
		frame: _frame,
		nodes: _nodes.length,
		edges: _edges.length,
		labeled,
		selected: _selected.size,
		tooltipStep: _tooltipStep,
		panStep: _panStep % PAN_ZOOM_STATES.length,
		iconEpoch: _iconEpoch,
		seriesOff: _seriesOff,
		churnRound: _churnRound,
	};
}

// Full expected-state snapshot for the harness's Node-side replay gates.
export function snapshotForGates() {
	return { topo: topoSnapshot(), charts: chartsSnapshot(), ui: uiSnapshot() };
}

reset();
