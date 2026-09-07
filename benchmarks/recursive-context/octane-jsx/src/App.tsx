import { useState, createContext, use } from 'octane';

// JSX (React-style `.tsx`) twin of ../../octane-tsrx/src/App.tsrx. Same balanced
// binary tree (depth D=10 → 1024 leaves, 2047 components) and the same two
// measurements:
//   __updateRoot()    — mutates the root context; ALL 1024 leaves re-read.
//   __updatePartial() — mutates state on a single mid-node at depth M=5; only
//                       that subtree (2^(D-M) = 32 leaves) re-reads.
//
// Only the authoring dialect differs from the `.tsrx` version: `@if/@else`
// directive blocks become plain JS control flow (early returns + a ternary),
// `class` → `className`, and the `{… as string}` text cast is dropped. Octane
// compiles both dialects to working blocks over the same runtime.

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

function Mid(props) {
	const [local, setLocal] = useState(0);
	const [visible, setVisible] = useState(true);
	_setLocal = setLocal;
	_setVisible = setVisible;
	return visible ? (
		<LocalCtx.Provider value={local}>
			<div className="mid">
				<Node depth={props.depth - 1} path={props.path + 'L'} />
				<Node depth={props.depth - 1} path={props.path + 'R'} />
			</div>
		</LocalCtx.Provider>
	) : null;
}

function Node(props) {
	if (props.depth > 0) {
		if (props.path === MID_PATH) {
			return <Mid depth={props.depth} path={props.path} />;
		}
		return (
			<div className="n">
				<Node depth={props.depth - 1} path={props.path + 'L'} />
				<Node depth={props.depth - 1} path={props.path + 'R'} />
			</div>
		);
	}
	return <Leaf path={props.path} />;
}

function Leaf(props) {
	const root = use(RootCtx);
	const local = use(LocalCtx);
	return <span className="leaf">{props.path + '|' + root + ':' + local}</span>;
}

export default function App(props) {
	const [root, setRoot] = useState(0);
	_setRoot = setRoot;
	return (
		<RootCtx.Provider value={root}>
			<Node depth={props.depth} path="" />
		</RootCtx.Provider>
	);
}
