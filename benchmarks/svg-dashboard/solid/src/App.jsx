import { For, Show, createRenderEffect, createStore, onCleanup, reconcile } from 'solid-js';
import { bindSetters, initialCharts, initialTopo, initialUi } from './ops.js';
import { Icon } from './Icons.jsx';

// Solid 2.0 svg-dashboard. Every domain lives in a store fed through
// reconcile-by-id — the dbmon pattern — so rows keep DOM identity even though
// the shared ops publish fresh row objects (reconcile over fresh object
// graphs is Solid's documented worst case; see the suite README). Keyed
// <For> everywhere; nested arrays (series/ticks/legend/stops) also carry
// `id`, so reconcile keys them uniformly and series hide/show drops keyed
// tails. The tooltip portal is hand-rolled: upstream <Portal> crashes under a
// render() root in the 2.0 beta (see benchmarks/portal-swarm/solid/src/App.jsx
// for the analysis).

// Solid resolves template namespaces at COMPILE time, and `a` is ambiguous
// (deliberately absent from its SVGElements set), so an `<a>`-rooted template
// or <Dynamic component="a"> yields an HTML anchor. There is no declarative
// way to author a dynamically-repeated SVG <a> in Solid — hand-roll the
// element (same escape hatch as the portal below); the children are
// unambiguous SVG tags, so plain JSX templates work for them.
function LegendA(props) {
	const el = document.createElementNS('http://www.w3.org/2000/svg', 'a');
	el.setAttribute('class', 'legend-item');
	// Solid 2.0 effect form: (compute, apply).
	createRenderEffect(
		() => props.item.transform,
		(t) => el.setAttribute('transform', t),
	);
	el.appendChild(<rect class={props.item.swatch} width="10" height="10" y="-9" />);
	el.appendChild(<text x="14">{props.item.label}</text>);
	return el;
}

function Tip(props) {
	const el = (
		<g class="tooltip" transform={props.ui.tooltip?.transform ?? ''}>
			<rect class="tooltip-bg" width="120" height="46" rx="4" />
			<text class="tt-title" x="8" y="14">
				{props.ui.tooltip?.title ?? ''}
			</text>
			<text class="tt-l1" x="8" y="28">
				{props.ui.tooltip?.l1 ?? ''}
			</text>
			<text class="tt-l2" x="8" y="42">
				{props.ui.tooltip?.l2 ?? ''}
			</text>
		</g>
	);
	props.target().appendChild(el);
	onCleanup(() => {
		if (el.parentNode) el.parentNode.removeChild(el);
	});
	return null;
}

export default function App() {
	const [topo, setTopo] = createStore(initialTopo());
	const [charts, setCharts] = createStore(initialCharts());
	const [ui, setUi] = createStore(initialUi());
	let overlayEl;
	bindSetters({
		setTopo: (next) =>
			setTopo((s) => {
				reconcile(next.nodes, 'id')(s.nodes);
				reconcile(next.edges, 'id')(s.edges);
				reconcile(next.icons, 'id')(s.icons);
			}),
		setCharts: (next) =>
			setCharts((s) => {
				reconcile(next.charts, 'id')(s.charts);
				reconcile(next.sparks, 'id')(s.sparks);
			}),
		setUi: (next) =>
			setUi((s) => {
				s.viewBox = next.viewBox;
				s.rootTransform = next.rootTransform;
				s.tooltip = next.tooltip;
			}),
	});

	return (
		<svg class="dash" width="1200" height="800" viewBox={ui.viewBox}>
			<title>svc dashboard</title>
			<defs>
				<symbol id="sym-ok" viewBox="0 0 24 24">
					<circle cx="12" cy="12" r="9" />
					<path d="M8 12.5l2.5 2.5L16 9" />
				</symbol>
				<symbol id="sym-warn" viewBox="0 0 24 24">
					<path d="M12 3 2 21h20L12 3z" />
					<line x1="12" y1="10" x2="12" y2="15" />
				</symbol>
				<symbol id="sym-err" viewBox="0 0 24 24">
					<circle cx="12" cy="12" r="9" />
					<path d="M9 9l6 6m0-6l-6 6" />
				</symbol>
				<For each={charts.charts}>
					{(ch) => (
						<linearGradient id={ch.gradId} x1="0" y1="0" x2="0" y2="1">
							<For each={ch.stops}>
								{(st) => <stop offset={st.off} stop-color={st.color} stop-opacity={st.opacity} />}
							</For>
						</linearGradient>
					)}
				</For>
			</defs>
			<g class="root" transform={ui.rootTransform}>
				<g class="topology">
					<g class="edges">
						<For each={topo.edges}>
							{(e) => <path class={e.cls} d={e.d} style={e.styleKebab} {...e.attrs} />}
						</For>
					</g>
					<g class="nodes">
						<For each={topo.nodes}>
							{(n) => (
								<g class={n.cls} transform={n.transform} {...n.attrs}>
									<rect class="node-body" x="-23" y="-15" width="46" height="30" rx="6" />
									<use class="node-sym" href={n.href} x="-8" y="-8" width="16" height="16" />
									<circle class="status-ring" r="19" />
									<Show when={n.labeled}>
										<foreignObject class="label-fo" x="-40" y="18" width="80" height="22">
											<div class="label">
												<span class="label-text">{n.labelText}</span>
											</div>
										</foreignObject>
									</Show>
								</g>
							)}
						</For>
					</g>
				</g>
				<g class="charts">
					<For each={charts.charts}>
						{(ch) => (
							<g class="chart" transform={ch.transform}>
								<rect class="chart-frame" width="430" height="92" />
								<g class="grid">
									<line class="gl" x1="36" y1="10" x2="416" y2="10" />
									<line class="gl" x1="36" y1="26" x2="416" y2="26" />
									<line class="gl" x1="36" y1="42" x2="416" y2="42" />
									<line class="gl" x1="36" y1="58" x2="416" y2="58" />
								</g>
								<path class="area" fill={ch.areaFill} d={ch.areaD} />
								<g class="series">
									<For each={ch.series}>{(s) => <path class={s.cls} d={s.lineD} />}</For>
								</g>
								<g class="xticks">
									<For each={ch.xTicks}>
										{(t) => (
											<g class="tick" transform={t.transform}>
												<line y2="4" />
												<text y="14">{t.label}</text>
											</g>
										)}
									</For>
								</g>
								<g class="yticks">
									<For each={ch.yTicks}>
										{(t) => (
											<g class="tick" transform={t.transform}>
												<line x2="-4" />
												<text x="-8">{t.label}</text>
											</g>
										)}
									</For>
								</g>
								<g class="legend">
									<For each={ch.legend}>{(l) => <LegendA item={l} />}</For>
								</g>
							</g>
						)}
					</For>
				</g>
				<g class="sparks">
					<For each={charts.sparks}>
						{(sp) => (
							<g class="spark" transform={sp.transform}>
								<path class="spark-line" d={sp.d} />
								<circle class="spark-dot" cx={sp.cx} cy={sp.cy} r="2" />
							</g>
						)}
					</For>
				</g>
				<g class="icons">
					<For each={topo.icons}>
						{(ic) => (
							<g class="icon" transform={ic.transform}>
								<Icon name={ic.name} />
							</g>
						)}
					</For>
				</g>
				<g class="overlay" ref={overlayEl} />
				<Show when={ui.tooltip}>
					<Tip ui={ui} target={() => overlayEl} />
				</Show>
			</g>
		</svg>
	);
}
