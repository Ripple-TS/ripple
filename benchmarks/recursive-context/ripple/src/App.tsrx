import { Context, track, type Tracked } from 'ripple';

// Balanced binary tree: depth D=10 → 1024 leaves, 2047 components.
//
// Two harness measurements:
//   __updateRoot()    — mutates the root Tracked; ALL 1024 leaves re-read.
//   __updatePartial() — mutates state on a single mid-node at depth M=5; only
//                       leaves in that subtree (2^(D-M) = 32) re-read.
//
// Each provider creates `let &[v, vT] = track(0)` — `v` is the reactive proxy
// (writable from closures), `vT` is the underlying Tracked object placed into
// Context so descendants can subscribe via `vT.value`.

const D = 10;
const M = 5;
const MID_PATH = 'L'.repeat(M);

const RootCtx = new Context<Tracked<number> | null>(null);
const LocalCtx = new Context<Tracked<number> | null>(null);

let _bumpRoot: any = null;
let _bumpLocal: any = null;
let _setVisible: any = null;
export function bumpRoot() {
	if (_bumpRoot) _bumpRoot();
}
export function bumpPartial() {
	if (_bumpLocal) _bumpLocal();
}
export function hideMid() {
	if (_setVisible) _setVisible(false);
}
export function showMid() {
	if (_setVisible) _setVisible(true);
}

function Mid(props) @{
	let &[visible] = track(true);
	_setVisible = (v) => {
		visible = v;
	};
	@if (visible) {
		let &[local, localT] = track(0);
		LocalCtx.set(localT);
		_bumpLocal = () => {
			local += 1;
		};
		<div class="mid">
			<Node depth={props.depth - 1} path={props.path + 'L'} />
			<Node depth={props.depth - 1} path={props.path + 'R'} />
		</div>
	}
}

function Node(props) @{
	@if (props.depth > 0) {
		@if (props.path === MID_PATH) {
			<Mid depth={props.depth} path={props.path} />
		} @else {
			<div class="n">
				<Node depth={props.depth - 1} path={props.path + 'L'} />
				<Node depth={props.depth - 1} path={props.path + 'R'} />
			</div>
		}
	} @else {
		<Leaf path={props.path} />
	}
}

function Leaf(props) @{
	const rootT = RootCtx.get();
	const localT = LocalCtx.get();
	// Reading `.value` inside the template invokes the getter → get_tracked() →
	// registers this leaf as a subscriber. Non-Mid leaves get null for localT
	// and harmlessly read 0.
	<span class="leaf">
		{props.path + '|' + (rootT ? rootT.value : 0) + ':' + (localT ? localT.value : 0)}
	</span>
}

export default function App(props) @{
	let &[root, rootT] = track(0);
	RootCtx.set(rootT);
	_bumpRoot = () => {
		root += 1;
	};
	<Node depth={props.depth} path="" />
}
