import { createSignal, For, Show, onCleanup } from 'solid-js';
import { ITEMS, sharedTarget, targetFor, hit } from './data.js';
import { bindA, bindB, bindBS } from './ops.js';

// Solid 2.0 portal-swarm twin. Solid has no value-position portal descriptor —
// a portal is its ONLY mechanism — so all three sections (A / B / B_stable) use
// the same `<Show>` + hand-rolled portal shape and the A/B/B_stable distinction
// collapses structurally. The sections still exist (same DOM, same window
// contract) so the harness drives all targets identically: for Solid the
// rerender ops measure fine-grained bypass (one text-node update; portals are
// never re-rendered), which IS Solid's honest number for "parent state changed
// while 200 portals are open".
//
// SUSPECTED SOLID BUG (@solidjs/web@2.0.0-beta.14): the built-in <Portal> crashes
// under a render() root. render$1 always registers the root (#main) as a
// delegated root (web.js:179); Portal's mount is wrapped in a Proxy via
// createElementProxy (web.js:889) and passed to `ownerRoot.contains(m)`
// (web.js:854-856), and native Node.contains throws on a Proxy
// ("parameter 1 is not of type 'Node'"). This fires for ANY <Portal> under a
// render() root regardless of fixture shape (reproduced with a single portal).
// We therefore hand-roll the portal — the standard userland Solid pattern
// (create the node, appendChild into the mount, onCleanup removes it) — which
// inserts children directly into the mount element (no wrapper div), matching
// the other fixtures' tooltip DOM. Because the tooltip lives OUTSIDE the
// delegated root, the button gets a DIRECT native listener (addEventListener,
// not Solid's delegated onClick, which would never reach content outside #main)
// so dispatch_through_portal still fires. See README caveats.

function Tip(props) {
	const el = (
		<div class={props.cls}>
			<span class="tip-label">{props.item.label}</span>
			<button class="tip-btn">hit</button>
		</div>
	);
	el.querySelector('.tip-btn').addEventListener('click', hit);
	const target = props.target;
	target.appendChild(el);
	onCleanup(() => {
		if (el.parentNode) el.parentNode.removeChild(el);
	});
	return null;
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
