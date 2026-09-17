import { Portal, track } from 'ripple';
import { bindSetters, initialCharts, initialTopo, initialUi } from './ops.js';
import { Icon } from './Icons.tsrx';

// Keep SVG markup in its explicit namespace. Each tracked domain updates only
// its dependent bindings; shared snapshots supply every DOM-bound value.

interface NodeRow {
	id: number;
	cls: string;
	transform: string;
	href: string;
	labeled: boolean;
	labelText: string;
	attrs: Record<string, string>;
}
interface EdgeRow {
	id: string;
	cls: string;
	d: string;
	style: Record<string, string>;
	styleKebab: Record<string, string>;
	attrs: Record<string, string>;
}
interface IconRow {
	id: number;
	transform: string;
	name: string;
}
interface StopRow {
	id: string;
	off: string;
	color: string;
	opacity: string;
}
interface TickRow {
	id: string;
	transform: string;
	label: string;
}
interface LegendRow {
	id: string;
	transform: string;
	swatch: string;
	label: string;
}
interface SeriesRow {
	id: string;
	cls: string;
	lineD: string;
}
interface ChartRow {
	id: string;
	transform: string;
	gradId: string;
	areaFill: string;
	areaD: string;
	stops: StopRow[];
	series: SeriesRow[];
	xTicks: TickRow[];
	yTicks: TickRow[];
	legend: LegendRow[];
}
interface SparkRow {
	id: string;
	transform: string;
	d: string;
	cx: string;
	cy: string;
}
interface TopoSnapshot {
	nodes: NodeRow[];
	edges: EdgeRow[];
	icons: IconRow[];
}
interface TooltipRow {
	id: number;
	transform: string;
	title: string;
	l1: string;
	l2: string;
}

interface ChartsSnapshot {
	charts: ChartRow[];
	sparks: SparkRow[];
}
interface UiSnapshot {
	viewBox: string;
	rootTransform: string;
	tooltip: TooltipRow | null;
}

export default function App() @{
	const topo = track<TopoSnapshot>(initialTopo());
	const charts = track<ChartsSnapshot>(initialCharts());
	const ui = track<UiSnapshot>(initialUi());
	let overlayRef: SVGGElement | undefined;
	bindSetters({
		setTopo: (value: TopoSnapshot) => {
			topo.value = value;
		},
		setCharts: (value: ChartsSnapshot) => {
			charts.value = value;
		},
		setUi: (value: UiSnapshot) => {
			ui.value = value;
		},
	});

	<svg class="dash" width="1200" height="800" viewBox={ui.value.viewBox}>
		<title>svc dashboard</title>
		<defs>
			<symbol id="sym-ok" viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="9"></circle>
				<path d="M8 12.5l2.5 2.5L16 9"></path>
			</symbol>
			<symbol id="sym-warn" viewBox="0 0 24 24">
				<path d="M12 3 2 21h20L12 3z"></path>
				<line x1="12" y1="10" x2="12" y2="15"></line>
			</symbol>
			<symbol id="sym-err" viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="9"></circle>
				<path d="M9 9l6 6m0-6l-6 6"></path>
			</symbol>
			@for (const ch of charts.value.charts; key ch.id) {
				<linearGradient id={ch.gradId} x1="0" y1="0" x2="0" y2="1">
					@for (const st of ch.stops; key st.id) {
						<stop offset={st.off} stop-color={st.color} stop-opacity={st.opacity}></stop>
					}
				</linearGradient>
			}
		</defs>
		<g class="root" transform={ui.value.rootTransform}>
			<g class="topology">
				<g class="edges">
					@for (const e of topo.value.edges; key e.id) {
						<path class={e.cls} d={e.d} style={e.style} {...e.attrs}></path>
					}
				</g>
				<g class="nodes">
					@for (const n of topo.value.nodes; key n.id) {
						<g class={n.cls} transform={n.transform} {...n.attrs}>
							<rect class="node-body" x="-23" y="-15" width="46" height="30" rx="6"></rect>
							<use class="node-sym" href={n.href} x="-8" y="-8" width="16" height="16"></use>
							<circle class="status-ring" r="19"></circle>
							@if (n.labeled) {
								<foreignObject class="label-fo" x="-40" y="18" width="80" height="22">
									<div class="label">
										<span class="label-text">{n.labelText as string}</span>
									</div>
								</foreignObject>
							}
						</g>
					}
				</g>
			</g>
			<g class="charts">
				@for (const ch of charts.value.charts; key ch.id) {
					<g class="chart" transform={ch.transform}>
						<rect class="chart-frame" width="430" height="92"></rect>
						<g class="grid">
							<line class="gl" x1="36" y1="10" x2="416" y2="10"></line>
							<line class="gl" x1="36" y1="26" x2="416" y2="26"></line>
							<line class="gl" x1="36" y1="42" x2="416" y2="42"></line>
							<line class="gl" x1="36" y1="58" x2="416" y2="58"></line>
						</g>
						<path class="area" fill={ch.areaFill} d={ch.areaD}></path>
						<g class="series">
							@for (const s of ch.series; key s.id) {
								<path class={s.cls} d={s.lineD}></path>
							}
						</g>
						<g class="xticks">
							@for (const t of ch.xTicks; key t.id) {
								<g class="tick" transform={t.transform}>
									<line y2="4"></line>
									<text y="14">{t.label as string}</text>
								</g>
							}
						</g>
						<g class="yticks">
							@for (const t of ch.yTicks; key t.id) {
								<g class="tick" transform={t.transform}>
									<line x2="-4"></line>
									<text x="-8">{t.label as string}</text>
								</g>
							}
						</g>
						<g class="legend">
							@for (const l of ch.legend; key l.id) {
								<a class="legend-item" transform={l.transform}>
									<rect class={l.swatch} width="10" height="10" y="-9"></rect>
									<text x="14">{l.label as string}</text>
								</a>
							}
						</g>
					</g>
				}
			</g>
			<g class="sparks">
				@for (const sp of charts.value.sparks; key sp.id) {
					<g class="spark" transform={sp.transform}>
						<path class="spark-line" d={sp.d}></path>
						<circle class="spark-dot" cx={sp.cx} cy={sp.cy} r="2"></circle>
					</g>
				}
			</g>
			<g class="icons">
				@for (const ic of topo.value.icons; key ic.id) {
					<g class="icon" transform={ic.transform}>
						<Icon name={track(() => ic.name)} />
					</g>
				}
			</g>
			<g class="overlay" ref={overlayRef}></g>
			@if (ui.value.tooltip !== null && overlayRef !== undefined) {
				<Portal target={overlayRef}>
					<g class="tooltip" transform={ui.value.tooltip!.transform}>
						<rect class="tooltip-bg" width="120" height="46" rx="4"></rect>
						<text class="tt-title" x="8" y="14">{ui.value.tooltip!.title as string}</text>
						<text class="tt-l1" x="8" y="28">{ui.value.tooltip!.l1 as string}</text>
						<text class="tt-l2" x="8" y="42">{ui.value.tooltip!.l2 as string}</text>
					</g>
				</Portal>
			}
		</g>
	</svg>
}
