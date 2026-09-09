import { track } from 'ripple';
import type { TextRow } from './text-types';

export function TypedText() @{
	let &[row] = track<TextRow>({ label: '<first>', count: 2 });
	<>
		<div class="typed-run">
			{'value: '}
			{row.label}
			{row.count}
			<span>tail</span>
		</div>
		<p class="typed-number">{row.count}</p>
		<button
			onClick={() => {
				row = { label: '&next', count: 3n };
			}}
		>update</button>
	</>
}
