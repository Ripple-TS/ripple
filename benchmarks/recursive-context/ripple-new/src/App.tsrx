import { useState, createContext, use } from 'ripple-new';

// Balanced binary tree: depth D=10 → 1024 leaves, 2047 components.
//
// Two harness measurements:
//   __updateRoot()    — mutates the root context; ALL 1024 leaves re-read.
//   __updatePartial() — mutates state on a single mid-node at depth M=5; only
//                       leaves in that subtree (2^(D-M) = 32) re-read. The
//                       rest of the tree stays put. The ratio of partial:root
//                       latency tells us how well the framework scopes
//                       descendant updates.

const D = 10;
const M = 5;
const MID_PATH = 'L'.repeat(M);

const RootCtx = createContext(0);
const LocalCtx = createContext(0);

// Module-level setter handles wired up on mount.
let _setRoot = null;
let _setLocal = null;
let _setVisible = null;
export function bumpRoot() {
	if (_setRoot) _setRoot((v) => v + 1);
}
export function bumpPartial() {
	if (_setLocal) _setLocal((v) => v + 1);
}
export function hideMid() {
	if (_setVisible) _setVisible(false);
}
export function showMid() {
	if (_setVisible) _setVisible(true);
}

function Mid(props) @{
	const [local, setLocal] = useState(0);
	const [visible, setVisible] = useState(true);
	_setLocal = setLocal;
	_setVisible = setVisible;
	@if (visible) {
		<LocalCtx.Provider value={local}>
			<div class="mid">
				<Node depth={props.depth - 1} path={props.path + 'L'} />
				<Node depth={props.depth - 1} path={props.path + 'R'} />
			</div>
		</LocalCtx.Provider>
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
	const root = use(RootCtx);
	const local = use(LocalCtx);
	<span class="leaf">
		{props.path + '|' + root + ':' + local as string}
	</span>
}

export default function App(props) @{
	const [root, setRoot] = useState(0);
	_setRoot = setRoot;
	<RootCtx.Provider value={root}>
		<Node depth={props.depth} path="" />
	</RootCtx.Provider>
}
