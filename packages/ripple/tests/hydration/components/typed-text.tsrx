import { track } from 'ripple';
import type { TextRow } from './text-types';

export function TypedText() @{
	const row = track<TextRow>({ label: '<first>', count: 2 });
	<>
		<div class="typed-run">
			{'value: '}
			{row.value.label}
			{row.value.count}
			<span>tail</span>
		</div>
		<p class="typed-number">
			{(0, row.value.count)}
		</p>
		<button
			onClick={() => {
				row.value = { label: '&next', count: 3n };
			}}
		>update</button>
	</>
}
