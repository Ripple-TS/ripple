import { Component } from 'inferno';

// Balanced binary tree: depth D=10 → 1024 leaves, 2047 components.
//
// Two harness measurements:
//   __updateRoot()    — App's setState; Inferno re-renders the entire tree.
//                       All 1024 leaves re-read the root context.
//   __updatePartial() — Mid's setState (mid-node at depth M=5); Inferno
//                       re-renders Mid + descendants (32 leaves). Leaves
//                       outside the Mid subtree are NOT touched.

const D = 10;
const M = 5;
const MID_PATH = 'L'.repeat(M);

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

class Mid extends Component {
	constructor(props) {
		super(props);
		this.state = { local: 0, visible: true };
		_setLocal = (update) =>
			this.setState(({ local }) => ({
				local: typeof update === 'function' ? update(local) : update,
			}));
		_setVisible = (visible) => this.setState({ visible });
	}

	getChildContext() {
		return { local: this.state.local };
	}

	render() {
		const { depth, path } = this.props;
		return this.state.visible ? (
			<div className="mid">
				<Node depth={depth - 1} path={path + 'L'} />
				<Node depth={depth - 1} path={path + 'R'} />
			</div>
		) : null;
	}
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

function Leaf({ path }, context) {
	const root = context.root ?? 0;
	const local = context.local ?? 0;
	return <span className="leaf">{path + '|' + root + ':' + local}</span>;
}

export default class App extends Component {
	constructor(props) {
		super(props);
		this.state = { root: 0 };
		_setRoot = (update) =>
			this.setState(({ root }) => ({ root: typeof update === 'function' ? update(root) : update }));
	}

	getChildContext() {
		return { root: this.state.root };
	}

	render() {
		return <Node depth={this.props.depth} path={''} />;
	}
}
