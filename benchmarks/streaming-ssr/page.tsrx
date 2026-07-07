import { trackAsync } from 'ripple';

/**
 * Shared mutable state so the benchmark harness can re-parameterize the page
 * between renders without recompiling: loaders return the row data for each
 * async boundary (fresh promise per render), syncRows/indices size the
 * synchronous and asynchronous parts of the workload.
 */
export const state = {
	loaders: [] as Array<() => Promise<string[]>>,
	syncRows: [] as string[],
	indices: [] as number[],
};

function AsyncSection({ index }: { index: number }) @{
	let &[rows] = trackAsync(() => state.loaders[index]());
	<section class="boundary">
		<ul>
			@for (let row of rows) {
				<li class="row">{row}</li>
			}
		</ul>
	</section>
}

export function Page() @{
	<main>
		<h1>{'Streaming benchmark'}</h1>
		<ul class="sync">
			@for (let row of state.syncRows) {
				<li>{row}</li>
			}
		</ul>
		@for (let index of state.indices) {
			@try {
				<AsyncSection index={index} />
			} @pending {
				<p class="loading">
					{'loading ' + index}
				</p>
			}
		}
	</main>
}

export function SyncPage() @{
	<main>
		<h1>{'Sync benchmark'}</h1>
		<ul class="sync">
			@for (let row of state.syncRows) {
				<li>{row}</li>
			}
		</ul>
	</main>
}
