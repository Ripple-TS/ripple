import { useState, createPortal } from 'octane';
import { ITEMS, sharedTarget, targetFor, hit } from './data.js';
import { bindA, bindB, bindBS } from './ops.js';
import { makeTipB, stableTipBS } from './tips.ts';

// portal-swarm: a 200-item list where every item conditionally portals a
// 3-element tooltip. THREE sections cover octane's portal entry points:
//
//   A        — `{createPortal(() => @{ … }, target)}` written directly at JSX
//              child position in .tsrx: the compiler lowers it to the `portal()`
//              runtime fast path (no descriptor allocation).
//   B        — a plain-.ts helper (tips.ts) builds `createPortal(...)` VALUE
//              descriptors that reach the DOM through a `{expr}` children hole
//              (the childSlot arm — the shape every @octanejs binding produces).
//   B_stable — section B with module-level, reference-stable descriptors
//              (children + props never change identity across re-renders).
//
// Each section owns its state (open / tick / distinct), so the harness can
// re-render one section at a time and attribute costs cleanly. The 200 `.pt`
// container divs for distinct-target mode are rendered by the fixture itself.

// Inline host-element portal body — React's common authoring shape; the
// compiler hoists it to a sub-template render fn (the same `portal()` fast
// path as the arrow `() => @{ … }` form).
function TipA(props) @{
	<span class="anchor">{createPortal(
		<div class="tip tipA">
			<span class="tip-label">{props.item.label as string}</span>
			<button class="tip-btn" onClick={hit}>{'hit'}</button>
		</div>,
		props.target,
	)}</span>
}

function SectionA() @{
	const [open, setOpen] = useState(false);
	const [tick, setTick] = useState(0);
	const [distinct, setDistinct] = useState(false);
	bindA(setOpen, setTick, setDistinct);

	<section class="secA">
		<h3 class="tick">{'A:' + tick}</h3>
		<ul class="list">
			@for (const item of ITEMS; key item.id) {
				<li class="item">
					<span class="label">{item.label as string}</span>
					@if (open) {
						<TipA item={item} target={distinct ? targetFor(item.id) : sharedTarget()} />
					}
				</li>
			}
		</ul>
	</section>
}

// Section B item: the `{expr}` hole flips between a PortalDescriptor and null —
// the full childSlot classifier path (portal mount/teardown at value position).
function ItemB(props) @{
	<li class="item">
		<span class="label">{props.item.label as string}</span>
		{props.open ? makeTipB(props.item, props.distinct) : null}
	</li>
}

function SectionB() @{
	const [open, setOpen] = useState(false);
	const [tick, setTick] = useState(0);
	const [distinct, setDistinct] = useState(false);
	bindB(setOpen, setTick, setDistinct);

	<section class="secB">
		<h3 class="tick">{'B:' + tick}</h3>
		<ul class="list">
			@for (const item of ITEMS; key item.id) {
				<ItemB item={item} open={open} distinct={distinct} />
			}
		</ul>
	</section>
}

function ItemBS(props) @{
	<li class="item">
		<span class="label">{props.item.label as string}</span>
		{props.open ? stableTipBS(props.item, props.distinct) : null}
	</li>
}

function SectionBS() @{
	const [open, setOpen] = useState(false);
	const [tick, setTick] = useState(0);
	const [distinct, setDistinct] = useState(false);
	bindBS(setOpen, setTick, setDistinct);

	<section class="secBS">
		<h3 class="tick">{'BS:' + tick}</h3>
		<ul class="list">
			@for (const item of ITEMS; key item.id) {
				<ItemBS item={item} open={open} distinct={distinct} />
			}
		</ul>
	</section>
}

// 200 container divs for distinct-target mode — rendered by the fixture so the
// per-target delegated-listener attach loop is measured against real,
// framework-rendered elements.
function Targets() @{
	<div class="targets">
		@for (const item of ITEMS; key item.id) {
			<div class="pt" id={'pt-' + item.id}></div>
		}
	</div>
}

export default function App() @{
	<div class="app">
		<SectionA />
		<SectionB />
		<SectionBS />
		<Targets />
	</div>
}
