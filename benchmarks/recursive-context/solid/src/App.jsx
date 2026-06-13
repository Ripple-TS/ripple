import { createSignal, createContext, useContext } from 'solid-js';

// Balanced binary tree: depth D=10 → 1024 leaves, 2047 components.
//
// Three harness measurements:
//   __updateRoot()      — App's setRoot; signal write propagates fine-grained
//                         to all 1024 leaves that subscribed via root().
//   __updatePartial()   — Mid's setLocal; only the 32 leaves inside the Mid
//                         subtree subscribed to LocalCtx via local(). Leaves
//                         outside the Mid subtree got the default getter
//                         (() => 0) which has no signal access, so they
//                         are never re-run.
//   __partialUnmount/Remount() — Mid's setVisible; toggles a boolean signal
//                         that the Mid body reads inside a ternary in JSX.
//                         When false, the LocalCtx + div + 32-leaf subtree
//                         disappears; Mid itself stays mounted so its
//                         setVisible handle remains valid for re-show.
//
// Idiom: place the signal GETTER in Context (not the scalar). Descendants
// invoke it inside JSX to subscribe.

const D = 10;
const M = 5;
const MID_PATH = 'L'.repeat(M);

// Default getters are non-reactive (no signal access) — non-Mid leaves invoke
// them and harmlessly get 0 without subscribing.
const RootCtx = createContext(() => 0);
const LocalCtx = createContext(() => 0);

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
	const [local, setLocal] = createSignal(0);
	const [visible, setVisible] = createSignal(true);
	_setLocal = setLocal;
	_setVisible = setVisible;
	// Solid 2.0: createContext() returns the provider FUNCTION directly —
	// no `.Provider` wrapper. <LocalCtx value={...}> IS the provider.
	//
	// The ternary on visible() is evaluated inside JSX, so Solid creates a
	// fine-grained dependency on the signal here. When visible flips to
	// false the entire LocalCtx + div + 32-leaf subtree is dropped; when it
	// flips back to true the subtree is freshly constructed. Using a plain
	// ternary (not <Show>) is correct because Mid's body itself runs once
	// and props.depth/path are stable.
	return (
		<>
			{visible() ? (
				<LocalCtx value={local}>
					<div class="mid">
						<Node depth={props.depth - 1} path={props.path + 'L'} />
						<Node depth={props.depth - 1} path={props.path + 'R'} />
					</div>
				</LocalCtx>
			) : null}
		</>
	);
}

function Node(props) {
	// Solid component bodies run ONCE; this ternary picks the right branch at
	// construction. props.depth/path never change after mount, so no need for
	// <Show> reactivity here.
	return props.depth > 0 ? (
		props.path === MID_PATH ? (
			<Mid depth={props.depth} path={props.path} />
		) : (
			<div class="n">
				<Node depth={props.depth - 1} path={props.path + 'L'} />
				<Node depth={props.depth - 1} path={props.path + 'R'} />
			</div>
		)
	) : (
		<Leaf path={props.path} />
	);
}

function Leaf(props) {
	const root = useContext(RootCtx);
	const local = useContext(LocalCtx);
	// root()/local() inside JSX create fine-grained subscriptions. The text
	// node updates surgically when either signal changes.
	return <span class="leaf">{props.path + '|' + root() + ':' + local()}</span>;
}

export default function App(props) {
	const [root, setRoot] = createSignal(0);
	_setRoot = setRoot;
	return (
		<RootCtx value={root}>
			<Node depth={props.depth} path={''} />
		</RootCtx>
	);
}
