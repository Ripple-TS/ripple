import { effect, track, type Tracked } from 'ripple';
import { fetchData, LEVELS } from './data.js';

// Ripple has no suspense: each level owns a tracked string seeded with a
// placeholder and an effect that re-runs whenever `version` changes, writing
// the resolved value in place. Children are created immediately (the DOM tree
// never waits on data), so all 10 fetches start in parallel — no waterfall by
// model — and updates are fine-grained writes with no re-render cascade.
export function Level({ level, version }: { level: number; version: Tracked<number> }) @{
	let &[data] = track('…');
	effect(() => {
		const v = version.value;
		fetchData(level, v).then((value) => {
			data = value;
		});
	});
	<div class="level" data-level={level}>
		<span class="val">{data}</span>
		@if (level < LEVELS - 1) {
			<Level level={level + 1} version={version} />
		}
	</div>
}

export function Main() @{
	const version: Tracked<number> = track(0);
	(window as any).__bump = () => {
		version.value += 1;
	};
	<Level level={0} version={version} />
}
