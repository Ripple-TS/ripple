import { Suspense, use, useState, startTransition } from 'octane';
import { fetchData, LEVELS } from './data.js';

// One async component per nesting level: `use(fetch)` suspends THIS level, so
// level N+1 doesn't even mount (let alone start its fetch) until level N's
// promise resolved — the classic nested-`use` waterfall this suite exists to
// measure. Expected init ≈ LEVELS × DELAY; updates re-run the same waterfall
// inside a transition (old content stays visible while it cascades).
function Level({ level, version }: { level: number; version: number }) @{
	const data = use(fetchData(level, version));
	<div class="level" data-level={level}>
		<span class="val">{data as string}</span>
		@if (level < LEVELS - 1) {
			<Level level={level + 1} version={version} />
		}
	</div>
}

export function Main() @{
	const [version, setVersion] = useState(0);
	// Update trigger for the harness: a transition-wrapped version bump — the
	// React-parity "refetch everything, keep old UI while pending" flow.
	(window as any).__bump = () => startTransition(() => setVersion((v: number) => v + 1));
	<Suspense fallback={<p class="loading">loading…</p>}>
		<Level level={0} version={version} />
	</Suspense>
}
