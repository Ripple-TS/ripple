import { track, Portal } from 'ripple';
import { ITEMS, sharedTarget, targetFor, hit } from './data.js';
import { bindA, bindB, bindBS } from './ops.js';

// Ripple portal-swarm twin. Ripple's built-in <Portal> ({ target, children })
// is its ONLY portal mechanism — like Solid, the A / B / B_stable distinction
// collapses structurally (all three sections render the same conditional
// <Portal> shape). The sections still exist (same DOM, same window contract)
// so the harness drives all targets identically: the rerender ops measure
// fine-grained bypass (one text-node update; open portals are never
// re-rendered), which IS Ripple's honest number for "parent state changed
// while 200 portals are open".
//
// Portal wires root-event delegation onto its target, so the tooltip button's
// plain onClick fires through the portal (document.body / the .pt containers
// are outside the #main delegated root). 200 portals sharing one target
// register the SAME module-level dispatcher, which addEventListener dedupes —
// a tooltip click bumps __hits exactly once.

interface Item {
	id: number;
	label: string;
}

function Tip(props: { item: Item; cls: string }) @{
	<div class={props.cls}>
		<span class="tip-label">{props.item.label}</span>
		<button class="tip-btn" onClick={hit}>{'hit'}</button>
	</div>
}

function Section(props: {
	secClass: string;
	tipClass: string;
	prefix: string;
	bind: (setOpen: (v: boolean) => void, setTick: (v: number) => void, setDistinct: (v: boolean) => void) => void;
}) @{
	let &[open] = track(false);
	let &[tick] = track(0);
	let &[distinct] = track(false);
	props.bind(
		(v: boolean) => {
			open = v;
		},
		(v: number) => {
			tick = v;
		},
		(v: boolean) => {
			distinct = v;
		},
	);

	<section class={props.secClass}>
		<h3 class="tick">{props.prefix + tick}</h3>
		<ul class="list">
			@for (const item of ITEMS; key item.id) {
				<li class="item">
					<span class="label">{item.label}</span>
					@if (open) {
						<Portal target={distinct ? targetFor(item.id) : sharedTarget()}>
							<Tip item={item} cls={props.tipClass} />
						</Portal>
					}
				</li>
			}
		</ul>
	</section>
}

// 200 container divs for distinct-target mode — rendered by the fixture itself.
function Targets() @{
	<div class="targets">
		@for (const item of ITEMS; key item.id) {
			<div class="pt" id={'pt-' + item.id}></div>
		}
	</div>
}

export default function App() @{
	<div class="app">
		<Section secClass="secA" tipClass="tip tipA" prefix="A:" bind={bindA} />
		<Section secClass="secB" tipClass="tip tipB" prefix="B:" bind={bindB} />
		<Section secClass="secBS" tipClass="tip tipBS" prefix="BS:" bind={bindBS} />
		<Targets />
	</div>
}
