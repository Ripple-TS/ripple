import { createContext, useContext, useState, useEffect } from 'react';

// Balanced binary tree: depth D=10 → 1024 leaves, 2047 components.
//
// Two harness measurements:
//   __updateRoot()    — App's setState; React re-renders the entire tree.
//                       All 1024 leaves re-read the root context.
//   __updatePartial() — Mid's setState (mid-node at depth M=5); React
//                       re-renders Mid + descendants (32 leaves). Leaves
//                       outside the Mid subtree are NOT touched.

const D = 10;
const M = 5;
const MID_PATH = 'L'.repeat(M);

const RootCtx = createContext(0);
const LocalCtx = createContext(0);

// Module-level setter handles captured during render; only one App + one Mid
// exist so simple last-write-wins capture is fine.
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

function Mid({ depth, path }) {
	const [local, setLocal] = useState(0);
	const [visible, setVisible] = useState(true);
	_setLocal = setLocal;
	_setVisible = setVisible;
	return visible ? (
		<LocalCtx.Provider value={local}>
			<div className="mid">
				<Node depth={depth - 1} path={path + 'L'} />
				<Node depth={depth - 1} path={path + 'R'} />
			</div>
		</LocalCtx.Provider>
	) : null;
}

function Node({ depth, path }) {
	if (depth > 0) {
		if (path === MID_PATH) {
			return <Mid depth={depth} path={path} />;
		}
		return (
			<div className="n">
				<Node depth={depth - 1} path={path + 'L'} />
				<Node depth={depth - 1} path={path + 'R'} />
			</div>
		);
	}
	return <Leaf path={path} />;
}

function Leaf({ path }) {
	const root = useContext(RootCtx);
	const local = useContext(LocalCtx);
	return <span className="leaf">{path + '|' + root + ':' + local}</span>;
}

export default function App({ depth }) {
	const [root, setRoot] = useState(0);
	_setRoot = setRoot;
	return (
		<RootCtx.Provider value={root}>
			<Node depth={depth} path={''} />
		</RootCtx.Provider>
	);
}
