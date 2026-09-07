import { createElement } from 'preact';
import { renderToPipeableStream } from 'preact-render-to-string/stream-node';
import { Writable } from 'node:stream';
import { App } from './App.jsx';
import { makeCards, type Scenario } from './data';

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
			write(chunk: Buffer, _encoding: BufferEncoding, callback: () => void) {
				onChunk(chunk.toString());
				callback();
			},
			final(callback: () => void) {
				callback();
				resolve();
			},
		});
		const { pipe } = renderToPipeableStream(createElement(App, { cards: makeCards(scenario) }), {
			onShellReady() {
				pipe(destination);
			},
			onShellError: reject,
			onError() {
				/* Per-boundary errors surface through the harness correctness gate. */
			},
		});
	});
}
