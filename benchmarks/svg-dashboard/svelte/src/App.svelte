<script>
	import { bindSetters, initialCharts, initialTopo, initialUi } from './ops.js';
	import { ICONS } from './data.js';
	import { portalTo } from './portal.js';

	// Snapshots are immutable and replaced wholesale; raw state avoids deep
	// proxies while keyed each blocks preserve row identity. The tooltip is
	// authored here but delivered into the overlay <g> by the attachment
	// portal (SVG has no z-index).
	let topo = $state.raw(initialTopo());
	let charts = $state.raw(initialCharts());
	let ui = $state.raw(initialUi());
	let overlayEl;
	bindSetters({
		setTopo: (n) => {
			topo = n;
		},
		setCharts: (n) => {
			charts = n;
		},
		setUi: (n) => {
			ui = n;
		},
	});
</script>

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
		{#each charts.charts as ch (ch.id)}
			<linearGradient id={ch.gradId} x1="0" y1="0" x2="0" y2="1">
				{#each ch.stops as st (st.id)}
					<stop offset={st.off} stop-color={st.color} stop-opacity={st.opacity} />
				{/each}
			</linearGradient>
		{/each}
	</defs>
	<g class="root" transform={ui.rootTransform}>
		<g class="topology">
			<g class="edges">
				{#each topo.edges as e (e.id)}
					<path
						class={e.cls}
						d={e.d}
						style:stroke-width={e.style.strokeWidth}
						style:stroke-opacity={e.style.strokeOpacity}
						{...e.attrs}
					/>
				{/each}
			</g>
			<g class="nodes">
				{#each topo.nodes as n (n.id)}
					<g class={n.cls} transform={n.transform} {...n.attrs}>
						<rect class="node-body" x="-23" y="-15" width="46" height="30" rx="6" />
						<use class="node-sym" href={n.href} x="-8" y="-8" width="16" height="16" />
						<circle class="status-ring" r="19" />
						{#if n.labeled}
							<foreignObject class="label-fo" x="-40" y="18" width="80" height="22">
								<div class="label"><span class="label-text">{n.labelText}</span></div>
							</foreignObject>
						{/if}
					</g>
				{/each}
			</g>
		</g>
		<g class="charts">
			{#each charts.charts as ch (ch.id)}
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
						{#each ch.series as s (s.id)}
							<path class={s.cls} d={s.lineD} />
						{/each}
					</g>
					<g class="xticks">
						{#each ch.xTicks as t (t.id)}
							<g class="tick" transform={t.transform}>
								<line y2="4" />
								<text y="14">{t.label}</text>
							</g>
						{/each}
					</g>
					<g class="yticks">
						{#each ch.yTicks as t (t.id)}
							<g class="tick" transform={t.transform}>
								<line x2="-4" />
								<text x="-8">{t.label}</text>
							</g>
						{/each}
					</g>
					<g class="legend">
						{#each ch.legend as l (l.id)}
							<a class="legend-item" transform={l.transform}>
								<rect class={l.swatch} width="10" height="10" y="-9" />
								<text x="14">{l.label}</text>
							</a>
						{/each}
					</g>
				</g>
			{/each}
		</g>
		<g class="sparks">
			{#each charts.sparks as sp (sp.id)}
				<g class="spark" transform={sp.transform}>
					<path class="spark-line" d={sp.d} />
					<circle class="spark-dot" cx={sp.cx} cy={sp.cy} r="2" />
				</g>
			{/each}
		</g>
		<g class="icons">
			{#each topo.icons as ic (ic.id)}
				<g class="icon" transform={ic.transform}>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class={'lucide i-' + ic.name}
					>
						{#each ICONS[ic.name] as shape, i (i)}
							<svelte:element this={shape[0]} {...shape[1]} />
						{/each}
					</svg>
				</g>
			{/each}
		</g>
		<g class="overlay" bind:this={overlayEl} />
		{#if ui.tooltip}
			<g class="tooltip" transform={ui.tooltip.transform} {@attach portalTo(overlayEl)}>
				<rect class="tooltip-bg" width="120" height="46" rx="4" />
				<text class="tt-title" x="8" y="14">{ui.tooltip.title}</text>
				<text class="tt-l1" x="8" y="28">{ui.tooltip.l1}</text>
				<text class="tt-l2" x="8" y="42">{ui.tooltip.l2}</text>
			</g>
		{/if}
	</g>
</svg>
