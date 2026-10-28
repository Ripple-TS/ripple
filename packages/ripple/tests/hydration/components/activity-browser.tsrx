import { Activity, effect } from 'ripple';

function Panel({ index }: { index: number }) @{
	if (typeof window !== 'undefined') {
		(window as any).recordActivity('initialize', index);
		const until = performance.now() + 8;
		while (performance.now() < until) {
			/* Deliberately expensive indivisible work. */
		}
		setTimeout(() => {
			(window as any).recordActivity('timer', index);
			document.querySelector('button')?.click();
		}, 0);
	}
	effect(() => {
		if (typeof window !== 'undefined') (window as any).recordActivity('effect', index);
	});
	<section>
		<input value={'panel ' + index} />
	</section>
}

export function App() @{
	<>
		<button onClick={() => (window as any).recordActivity('input')}>Input remains available</button>
		@for (const index of Array.from({ length: 12 }, (_, index) => index)) {
			<Activity mode="hidden">
				<Panel {index} />
			</Activity>
		}
	</>
}
