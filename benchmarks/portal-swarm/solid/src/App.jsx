import { createSignal, For, Show } from 'solid-js';
import { Portal } from '@solidjs/web';
import { ITEMS, sharedTarget, targetFor, hit } from './data.js';
import { bindA, bindB, bindBS } from './ops.js';

// Solid 2.0 portal-swarm twin. Solid has no value-position portal descriptor —
// a portal is its ONLY mechanism — so all three sections (A / B / B_stable) use
// the same `<Show>` + `<Portal>` shape and the A/B/B_stable distinction
// collapses structurally. The sections still exist (same DOM, same window
// contract) so the harness drives all targets identically: for Solid the
// rerender ops measure fine-grained bypass (one text-node update; portals are
// never re-rendered), which IS Solid's honest number for "parent state changed
// while 200 portals are open".
//
// Section A uses Solid's built-in <Portal> from @solidjs/web with a delegated
// onClick inside it. (An earlier revision hand-rolled the portal and attached a
// native listener to work around a `<Portal>` crash under a render() root in
// @solidjs/web@2.0.0-beta.14; the pinned RC no longer has it, and the built-in
// Portal mounts its children directly into the target with no wrapper element,
// so the tooltip DOM matches the other fixtures.) Solid delegates the click
// through the portal's mount, so dispatch_through_portal measures a delegated
// hop like the other delegating frameworks.

function Tip(props) {
	return (
		<Portal mount={props.target}>
			<div class={props.cls}>
				<span class="tip-label">{props.item.label}</span>
				<button class="tip-btn" onClick={hit}>
					hit
				</button>
			</div>
		</Portal>
	);
}

function Section(props) {
	const [open, setOpen] = createSignal(false);
	const [tick, setTick] = createSignal(0);
	const [distinct, setDistinct] = createSignal(false);
	props.bind(setOpen, setTick, setDistinct);

	return (
		<section class={props.secClass}>
			<h3 class="tick">{props.prefix + tick()}</h3>
			<ul class="list">
				<For each={ITEMS}>
					{(item) => (
						<li class="item">
							<span class="label">{item.label}</span>
							<Show when={open()}>
								<Tip
									item={item}
									cls={props.tipClass}
									target={distinct() ? targetFor(item.id) : sharedTarget()}
								/>
							</Show>
						</li>
					)}
				</For>
			</ul>
		</section>
	);
}

// 200 container divs for distinct-target mode — rendered by the fixture itself.
function Targets() {
	return (
		<div class="targets">
			<For each={ITEMS}>{(item) => <div class="pt" id={'pt-' + item.id}></div>}</For>
		</div>
	);
}

export default function App() {
	return (
		<div class="app">
			<Section secClass="secA" tipClass="tip tipA" prefix="A:" bind={bindA} />
			<Section secClass="secB" tipClass="tip tipB" prefix="B:" bind={bindB} />
			<Section secClass="secBS" tipClass="tip tipBS" prefix="BS:" bind={bindBS} />
			<Targets />
		</div>
	);
}
