import { Activity, useState, useEffect, useLayoutEffect } from 'ripple-new';

// Child logs render + effect mount/unmount, exposes its setState so the test can
// bump state, and renders its count so state preservation is observable.
function Child(props) @{
	const [n, setN] = useState(0);
	props.expose(setN);
	useLayoutEffect(() => {
		props.log('mount layout');
		return () => props.log('unmount layout');
	}, []);
	useEffect(() => {
		props.log('mount passive');
		return () => props.log('unmount passive');
	}, []);
	props.log('render');
	<span id="child">
		{n as number}
	</span>
}

export function ActivityHost(props) @{
	<div id="host">
		<Activity mode={props.mode}>
			<Child log={props.log} expose={props.expose} />
		</Activity>
	</div>
}

// Bare-text Activity child: when hidden, the direct text node (no element box,
// can't take display:none) must still be hidden — see hideActivityRange.
export function TextActivityHost(props) @{
	<div id="host">
		<Activity mode={props.mode}>
			{props.text as string}
		</Activity>
	</div>
}

// Nested: an inner Activity (mode controlled separately) inside an outer one.
function Inner(props) @{
	useLayoutEffect(() => {
		props.log('mount inner');
		return () => props.log('unmount inner');
	}, []);
	props.log('render inner');
	<span id="inner">{'inner'}</span>
}

export function NestedActivity(props) @{
	<div id="host">
		<Activity mode={props.outer}>
			<Activity mode={props.inner}>
				<Inner log={props.log} />
			</Activity>
		</Activity>
	</div>
}
