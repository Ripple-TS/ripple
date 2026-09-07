import { createElement } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { Writable } from 'node:stream';
import { App } from './App.tsrx';
import { makeCards, type Scenario } from './data';

// Streaming SSR entry — React 19 target. Fizz's renderToPipeableStream expects
// a real Node Writable (it consults write()'s backpressure return value), so
// the harness chunk callback is wrapped in a minimal Writable. pipe() happens
// in onShellReady — the standard Fizz streaming pattern (piping earlier is not
// part of the public contract; piping in onAllReady would buffer everything).
export const streaming = true;

export function createBenchmarkStream(
	scenario: Scenario,
	options: Parameters<typeof renderToPipeableStream>[1] = {},
) {
	return renderToPipeableStream(createElement(App, { cards: makeCards(scenario) }), options);
}

export function renderStream(scenario: Scenario, onChunk: (chunk: string) => void): Promise<void> {
	return new Promise((resolve, reject) => {
		const destination = new Writable({
			write(chunk: Buffer, _enc: string, cb: () => void) {
				onChunk(chunk.toString());
				cb();
			},
			final(cb: () => void) {
				cb();
				resolve();
			},
		});
		const { pipe } = renderToPipeableStream(createElement(App, { cards: makeCards(scenario) }), {
			onShellReady() {
				pipe(destination);
			},
			onShellError: reject,
			onError() {
				/* per-boundary errors surface through the harness correctness gate */
			},
		});
	});
}
