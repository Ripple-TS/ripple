import { RippleArray } from 'ripple';

// Keyed-@for reconcile fixture. Four item shapes that exercise the different
// anchor-resolution paths in the runtime's for.js / switch.js:
//
//   direct  : <div>{x}</div>                  item block records s.start  (O(1))
//   wrapped : <div><RowIf {item} /></div>     item block records s.start  (O(1))
//   single  : <RowIf {item} />                single control-flow root → s.start
//                                             is null → reconcile descends child
//                                             blocks (the #1307-optimized path)
//   switch  : <RowSwitch {item} />            single @switch root → same descent,
//                                             through a SWITCH_BLOCK
//
// The list components create their RippleArray internally (it needs a component
// context) and publish it + the reorder ops to module scope so the Playwright
// harness can drive them via window.*.

let _items = null;

function makeItems(n) {
	const out = [];
	for (let i = 0; i < n; i++) {
		out.push({ id: i, label: 'item-' + i, kind: i % 2 ? 'a' : 'b' });
	}
	return out;
}

function mulberry32(seed) {
	return function () {
		seed |= 0;
		seed = seed + 1831565813 | 0;
		let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
let _rand = mulberry32(4660);

export function reverse() {
	_items.reverse();
}
export function shuffle() {
	const items = _items;
	for (let k = items.length - 1; k > 0; k--) {
		const j = Math.floor(_rand() * (k + 1));
		const tmp = items[k];
		items[k] = items[j];
		items[j] = tmp;
	}
}
export function resetRand() {
	_rand = mulberry32(4660);
}

function RowIf(props) @{
	@if (true) {
		<div class="row">{props.item.label}</div>
	}
}

function RowSwitch(props) @{
	@switch (props.item.kind) {
		@case 'a': {
			<div class="row">{props.item.label}</div>
		}
		@default: {
			<div class="row">{props.item.label}</div>
		}
	}
}

export function DirectList(props) @{
	const items = _items = new RippleArray(...makeItems(props.n));
	@for (const item of items; key item.id) {
		<div class="row">{item.label}</div>
	}
}

export function WrappedList(props) @{
	const items = _items = new RippleArray(...makeItems(props.n));
	@for (const item of items; key item.id) {
		<div>
			<RowIf {item} />
		</div>
	}
}

export function SingleList(props) @{
	const items = _items = new RippleArray(...makeItems(props.n));
	@for (const item of items; key item.id) {
		<RowIf {item} />
	}
}

export function SwitchList(props) @{
	const items = _items = new RippleArray(...makeItems(props.n));
	@for (const item of items; key item.id) {
		<RowSwitch {item} />
	}
}
