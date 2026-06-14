import { useRef, useEffect } from 'ripple-new';

// Array-valued ref form: `ref={[a, b]}` attaches BOTH refs to the same
// element. Matches React's canonical convention (the `react-merge-refs`
// pattern lifted into the runtime). attachRef in src/runtime.ts iterates
// the array and applies each shape (function / object) independently.
//
// The effect body reads the target via a positional dep arg (`tgt`) while
// closing over the `a`/`b` refs — exercising ripple-new's deps-as-args
// convention (the runtime spreads the deps array as positional arguments).
export function ArrayRefsOneEl(props) @{
	const a = useRef(null);
	const b = useRef(null);
	useEffect((tgt) => {
		tgt.a = a.current;
		tgt.b = b.current;
	}, [props.target]);
	<div class="multi" ref={[a, b]}>{'mounted'}</div>
}
