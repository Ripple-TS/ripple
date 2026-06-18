import { useState, useRef, useLayoutEffect, Fragment } from 'ripple-new';

// React-19 commit-phase ref timing: a callback ref must fire with a CONNECTED
// node (the subtree is in the document), and ref.current must be populated
// before layout effects run. Cross-component refs attach child-before-parent.

export function ConnectedRef(props) @{
	<div id="host" ref={(el) => props.observe(el)}>{'x'}</div>
}

export function RefInLayout(props) @{
	const r = useRef(null);
	useLayoutEffect(() => {
		props.observe(r.current);
	}, []);
	<div id="host" ref={r}>{'x'}</div>
}

function TimingChild(props) @{
	const [n] = useState(0);
	<span id="child" ref={() => props.log('child')}>
		{n as number}
	</span>
}

export function NestedTiming(props) @{
	<div id="parent" ref={() => props.log('parent')}>
		<TimingChild log={props.log} />
	</div>
}

// A callback ref and a useLayoutEffect co-located in one component, to pin the
// ordering relative to each other: on mount the ref attaches before the layout
// effect body; on unmount the layout cleanup runs before the ref detaches
// (React's commit-phase contract).
export function RefAndLayout(props) @{
	useLayoutEffect(() => {
		props.log('layout:body');
		return () => props.log('layout:cleanup');
	}, []);
	<div
		id="host"
		ref={() => {
			props.log('ref:attach');
			return () => props.log('ref:cleanup');
		}}
	>{'x'}</div>
}

// A fragment callback ref: at call time its child (#fragtiming) must already be
// connected to the document (deferred to commit). The callback ignores the
// FragmentInstance and reports the child's connectivity.
export function FragmentTiming(props) @{
	<div>
		<Fragment
			ref={() => props.observe(document.querySelector('#fragtiming')?.isConnected ?? false)}
		>
			<span id="fragtiming">{'x'}</span>
		</Fragment>
	</div>
}
