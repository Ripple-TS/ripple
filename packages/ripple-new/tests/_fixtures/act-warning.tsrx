import { useState } from 'ripple-new';

// Exposes its `setN` via a module-level shim so tests can fire updates from
// outside the component body — exactly the situation `act()` warns about.
let _setN = null;
export function bump() {
	if (_setN) _setN((n) => n + 1);
}

export default function Counter() @{
	const [n, setN] = useState(0);
	_setN = setN;
	<div class="c">
		{n as number}
	</div>
}
