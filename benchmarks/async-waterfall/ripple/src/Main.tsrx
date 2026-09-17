import { effect, track, type Tracked } from 'ripple';
import { fetchData, LEVELS } from './data.js';

// Each level owns a tracked string seeded with a placeholder and an effect
// that re-runs whenever `version` changes, writing the resolved value in
// place. Children are created immediately (the DOM tree never waits on data),
// so all 10 fetches start in parallel — no waterfall by model — and updates
// are fine-grained writes with no re-render cascade.
//
// Ripple's boundary model (`trackAsync()` inside `@try { … } @pending { … }`)
// expresses the same tree, but each level then owns a boundary that renders
// its pending branch in a microtask, moves the resolved content to a fragment
// and back, and resumes a paused block on completion: measured at roughly
// twice this fixture's cold mount and three times its resolution tail, so the
// plain tracked-value model stays.
export function Level({ level, version }: { level: number; version: Tracked<number> }) @{
	const data = track('…');
	effect(() => {
		const v = version.value;
		fetchData(level, v).then((value) => {
			data.value = value;
		});
	});
	<div class="level" data-level={level}>
		<span class="val">{data.value}</span>
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
