import { useState } from 'ripple-new';

// @if + @else demo. Branch-local hooks are a ripple-new feature React
// doesn't support — useState inside the @if body gets its own scope and
// resets when the branch unmounts/remounts. Toggle to see counter reset.
export function Conditional() @{
	const [open, setOpen] = useState(true);

	<div>
		<h2 class="demo-title">{'Conditional + branch-local state'}</h2>
		<p
			class="demo-blurb"
		>{'@if / @else with useState INSIDE the branch body — the inner counter resets every time you toggle.'}</p>
		<div class="row">
			<button class="btn" onClick={() => setOpen((o) => !o)}>
				{(open ? 'collapse' : 'expand') as string}
			</button>
		</div>
		@if (open) {
			const [bumps, setBumps] = useState(0);

			<div class="panel" style="margin-top: 12px">
				<p style="margin: 0 0 8px">
					{'inner bumps: ' + bumps as string}
				</p>
				<button class="btn" onClick={() => setBumps((b) => b + 1)}>{'bump inner'}</button>
			</div>
		} @else {
			<p
				style="color: var(--muted); margin-top: 12px"
			>{'(collapsed — re-expand to see the counter reset)'}</p>
		}
	</div>
}
