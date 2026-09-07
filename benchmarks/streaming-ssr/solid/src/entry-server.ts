import { renderToStream } from '@solidjs/web';
import { App } from './App.tsrx';
import { makeCards, type Scenario } from './data';

// Streaming SSR entry — Solid 2.0 target. `renderToStream` streams the shell
// with fallbacks, then per-boundary replacement segments as each async read
// resolves. Its pipe() accepts a plain { write, end } destination (per
// @solidjs/web's server types), so the harness chunk callback plugs in
// directly. Note the Solid 2.0 import site is '@solidjs/web' (the runtime
// split), not solid-js/web.
export const streaming = true;

export function createBenchmarkStream(scenario: Scenario) {
	return renderToStream(() => App({ cards: makeCards(scenario) }), {
		onError: () => {},
	});
}

export function renderStream(scenario: Scenario, onChunk: (chunk: string) => void): Promise<void> {
	return new Promise((resolve, reject) => {
		try {
			renderToStream(() => App({ cards: makeCards(scenario) }), {
				onError: (err: unknown) => {
					/* per-boundary errors surface through the harness correctness gate */
					void err;
				},
			}).pipe({
				write: onChunk,
				end: resolve,
			});
		} catch (err) {
			reject(err);
		}
	});
}
