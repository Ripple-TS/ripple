import { Component, createPortal } from 'inferno';
import { bindSetters, initialCharts, initialTopo, initialUi } from './ops.js';
import { icon } from './Icons.js';

// Native Inferno svg-dashboard VDOM baseline. Same shared state
// snapshots and identical rendered DOM as the sibling fixtures. Rows and
// domain sections use shallow prop bails: ops that leave row
// objects reference-identical bail out per row, so the measured work is
// Inferno's keyed diff + re-render of the rows an op actually touched.

function memo(renderComponent) {
	return class Memoized extends Component {
		shouldComponentUpdate(nextProps) {
			const previous = this.props;
			const previousKeys = Object.keys(previous);
			const nextKeys = Object.keys(nextProps);
			if (previousKeys.length !== nextKeys.length) return true;
			return nextKeys.some((key) => nextProps[key] !== previous[key]);
		}

		render() {
			return renderComponent(this.props);
		}
	};
}

const EdgePath = memo(function EdgePath({ e }) {
	return <path className={e.cls} d={e.d} style={e.styleKebab} {...e.attrs} />;
});

const NodeG = memo(function NodeG({ n }) {
	return (
		<g className={n.cls} transform={n.transform} {...n.attrs}>
			<rect className="node-body" x="-23" y="-15" width="46" height="30" rx="6" />
			<use className="node-sym" href={n.href} x="-8" y="-8" width="16" height="16" />
			<circle className="status-ring" r="19" />
			{n.labeled ? (
				<foreignObject className="label-fo" x="-40" y="18" width="80" height="22">
					<div className="label">
						<span className="label-text">{n.labelText}</span>
					</div>
				</foreignObject>
			) : null}
		</g>
	);
});

const Topology = memo(function Topology({ topo }) {
	return (
		<g className="topology">
			<g className="edges">
				{topo.edges.map((e) => (
					<EdgePath key={e.id} e={e} />
				))}
			</g>
			<g className="nodes">
				{topo.nodes.map((n) => (
					<NodeG key={n.id} n={n} />
				))}
			</g>
		</g>
	);
});

const Gradient = memo(function Gradient({ ch }) {
	return (
		<linearGradient id={ch.gradId} x1="0" y1="0" x2="0" y2="1">
			{ch.stops.map((st) => (
				<stop key={st.id} offset={st.off} stopColor={st.color} stopOpacity={st.opacity} />
			))}
		</linearGradient>
	);
});

const Gradients = memo(function Gradients({ charts }) {
	return charts.map((ch) => <Gradient key={ch.id} ch={ch} />);
});

const SeriesPath = memo(function SeriesPath({ s }) {
	return <path className={s.cls} d={s.lineD} />;
});

const XTick = memo(function XTick({ t }) {
	return (
		<g className="tick" transform={t.transform}>
			<line y2="4" />
			<text y="14">{t.label}</text>
		</g>
	);
});

const YTick = memo(function YTick({ t }) {
	return (
		<g className="tick" transform={t.transform}>
			<line x2="-4" />
			<text x="-8">{t.label}</text>
		</g>
	);
});

const LegendItem = memo(function LegendItem({ item }) {
	return (
		<a className="legend-item" transform={item.transform}>
			<rect className={item.swatch} width="10" height="10" y="-9" />
			<text x="14">{item.label}</text>
		</a>
	);
});

const ChartG = memo(function ChartG({ ch }) {
	return (
		<g className="chart" transform={ch.transform}>
			<rect className="chart-frame" width="430" height="92" />
			<g className="grid">
				<line className="gl" x1="36" y1="10" x2="416" y2="10" />
				<line className="gl" x1="36" y1="26" x2="416" y2="26" />
				<line className="gl" x1="36" y1="42" x2="416" y2="42" />
				<line className="gl" x1="36" y1="58" x2="416" y2="58" />
			</g>
			<path className="area" fill={ch.areaFill} d={ch.areaD} />
			<g className="series">
				{ch.series.map((s) => (
					<SeriesPath key={s.id} s={s} />
				))}
			</g>
			<g className="xticks">
				{ch.xTicks.map((t) => (
					<XTick key={t.id} t={t} />
				))}
			</g>
			<g className="yticks">
				{ch.yTicks.map((t) => (
					<YTick key={t.id} t={t} />
				))}
			</g>
			<g className="legend">
				{ch.legend.map((l) => (
					<LegendItem key={l.id} item={l} />
				))}
			</g>
		</g>
	);
});

const ChartsStrip = memo(function ChartsStrip({ charts }) {
	return (
		<g className="charts">
			{charts.map((ch) => (
				<ChartG key={ch.id} ch={ch} />
			))}
		</g>
	);
});

const SparkG = memo(function SparkG({ sp }) {
	return (
		<g className="spark" transform={sp.transform}>
			<path className="spark-line" d={sp.d} />
			<circle className="spark-dot" cx={sp.cx} cy={sp.cy} r="2" />
		</g>
	);
});

const Sparks = memo(function Sparks({ sparks }) {
	return (
		<g className="sparks">
			{sparks.map((sp) => (
				<SparkG key={sp.id} sp={sp} />
			))}
		</g>
	);
});

const IconG = memo(function IconG({ ic }) {
	return (
		<g className="icon" transform={ic.transform}>
			{icon(ic.name)}
		</g>
	);
});

const IconLayer = memo(function IconLayer({ icons }) {
	return (
		<g className="icons">
			{icons.map((ic) => (
				<IconG key={ic.id} ic={ic} />
			))}
		</g>
	);
});

function Tooltip({ t }) {
	return (
		<g className="tooltip" transform={t.transform}>
			<rect className="tooltip-bg" width="120" height="46" rx="4" />
			<text className="tt-title" x="8" y="14">
				{t.title}
			</text>
			<text className="tt-l1" x="8" y="28">
				{t.l1}
			</text>
			<text className="tt-l2" x="8" y="42">
				{t.l2}
			</text>
		</g>
	);
}

export default class App extends Component {
	constructor(props) {
		super(props);
		this.state = { topo: initialTopo(), charts: initialCharts(), ui: initialUi() };
		bindSetters({
			setTopo: (update) =>
				this.setState(({ topo }) => ({
					topo: typeof update === 'function' ? update(topo) : update,
				})),
			setCharts: (update) =>
				this.setState(({ charts }) => ({
					charts: typeof update === 'function' ? update(charts) : update,
				})),
			setUi: (update) =>
				this.setState(({ ui }) => ({ ui: typeof update === 'function' ? update(ui) : update })),
		});
	}

	setOverlay = (overlay) => {
		if (overlay) this.overlay = overlay;
	};

	render() {
		const { topo, charts, ui } = this.state;
		return (
			<svg className="dash" width="1200" height="800" viewBox={ui.viewBox}>
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
					<Gradients charts={charts.charts} />
				</defs>
				<g className="root" transform={ui.rootTransform}>
					<Topology topo={topo} />
					<ChartsStrip charts={charts.charts} />
					<Sparks sparks={charts.sparks} />
					<IconLayer icons={topo.icons} />
					<g className="overlay" ref={this.setOverlay} />
					{ui.tooltip !== null && this.overlay
						? createPortal(<Tooltip t={ui.tooltip} />, this.overlay)
						: null}
				</g>
			</svg>
		);
	}
}
