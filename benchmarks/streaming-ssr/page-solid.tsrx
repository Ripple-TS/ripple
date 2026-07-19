import { createMemo } from 'solid-js';

/**
 * Solid 2.0 mirror of page.tsrx: async data is "a computation that returns a
 * promise" (createMemo over the loader) read under a `@try/@pending`
 * boundary, which tsrx-solid lowers to Solid's `<Loading>`.
 *
 * Kept annotation-free so the tsrx-solid output is plain JSX and the babel
 * step only needs babel-preset-solid.
 */
export const state = {
	loaders: [],
	syncRows: [],
	indices: [],
};

function AsyncSection(props) @{
	const rows = createMemo(() => state.loaders[props.index]());
	<section class="boundary">
		<ul>
			@for (let row of rows()) {
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
				<p class="loading">{'loading ' + index}</p>
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
