import { effect, track } from 'ripple';
import { createMemoryHistory } from '@ripple-ts/tanstack-router';
import type { ProbeProps } from './index.js';

export function Probe({ onMount, onDispose }: ProbeProps) @{
	const history = createMemoryHistory({ initialEntries: ['/foundation'] });
	const clicks = track(0);
	effect(() => {
		onMount?.();
		return () => {
			history.destroy();
			onDispose?.();
		};
	});
	<button onClick={() => clicks.value++} data-path={history.location.pathname}>
		{'Clicks: ' + clicks.value}
	</button>
}
