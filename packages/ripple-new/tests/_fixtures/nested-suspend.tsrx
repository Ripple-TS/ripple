import { useState, useMemo, use } from 'ripple-new';

// Regression fixture for the nested-block suspend data-loss bug. A `@try` body
// holds two hookful child components. The Counter suspends on its OWN re-render
// (it swaps a resolved promise for a pending one via state), so the suspend
// originates in a nested descendant block — NOT the try-body block. The whole
// try subtree's hook state (useState in both children, useMemo cache) must
// survive the suspend → resolve cycle, matching React's
// committed-state-preserved-while-suspended contract.

let _bumpChild: any = null;
let _goChild: any = null;
let _bumpSibling: any = null;
let _memoCalls = 0;

export function bumpChild() {
	_bumpChild();
}
export function goChild() {
	_goChild();
}
export function bumpSibling() {
	_bumpSibling();
}
export function getMemoCalls() {
	return _memoCalls;
}
export function resetMemoCalls() {
	_memoCalls = 0;
}

function Counter(props) @{
	const [n, setN] = useState(0);
	const [p, setP] = useState(props.resolved);
	const tag = useMemo(() => {
		_memoCalls++;
		return 'M';
	}, []);
	_bumpChild = () => setN(n + 1);
	_goChild = () => setP(props.gate);
	const v = use(p);
	<div id="counter">
		{n + '/' + v as string + '/' + tag as string}
	</div>
}

function Sibling() @{
	const [m, setM] = useState(0);
	_bumpSibling = () => setM(m + 1);
	<div id="sibling">
		{m as number}
	</div>
}

export function NestedSuspendBoundary(props) @{
	<>
		@try {
			<>
				<Counter resolved={props.resolved} gate={props.gate} />
				<Sibling />
			</>
		} @pending {
			<div id="fallback">{'loading'}</div>
		}
	</>
}
