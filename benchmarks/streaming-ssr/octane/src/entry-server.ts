import { renderToPipeableStream } from 'octane/server';
import { App } from './App.tsrx';
import { cardData, makeCards, type CardData, type CardSlot, type Scenario } from './data';

// Streaming SSR entry — octane target. The harness (../run.mjs) imports the
// BUILT bundle of this module and times renderStream(): data promises start at
// call time (like backend requests fired when the HTTP request arrives), then
// octane's renderToPipeableStream drives its pass-based out-of-order stream
// into the harness-supplied chunk callback. Octane's signature convention is
// (Component, props?, options?) and chunks buffer until pipe() — piping the
// plain { write, end } destination immediately makes every write land in
// onChunk in real time.
export const streaming = true;

export function createBenchmarkStream(
	scenario: Scenario,
	options: Parameters<typeof renderToPipeableStream>[2] = {},
) {
	return renderToPipeableStream(App, { cards: makeCards(scenario) }, options);
}

export function renderStream(scenario: Scenario, onChunk: (chunk: string) => void): Promise<void> {
	return new Promise((resolve, reject) => {
		const { pipe } = renderToPipeableStream(
			App,
			{ cards: makeCards(scenario) },
			{ onShellError: reject },
		);
		pipe({
			write: onChunk,
			end: resolve,
		});
	});
}

// CPU/scaling control for the same compiled page, without the data timers of
// the cross-framework schedule. The producer releases a group only after the
// previous response chunk is accepted, so the shell remains genuinely streamed
// and the runtime's own wave/coalescing work stays inside the measurement.
export function renderControlledStream(
	cardCount: number,
	waveSize: number,
	onChunk: (chunk: string) => void,
): Promise<void> {
	const resolveCards: Array<() => void> = [];
	const cards: CardSlot[] = Array.from({ length: cardCount }, (_, id) => ({
		id,
		promise: new Promise<CardData>((resolve) => resolveCards.push(() => resolve(cardData(id)))),
	}));
	let remaining = cardCount;
	return new Promise((resolve, reject) => {
		const stream = renderToPipeableStream(
			App,
			{ cards },
			{ onShellError: reject, onError: reject },
		);
		stream.pipe({
			write(chunk) {
				onChunk(chunk);
				for (let i = Math.min(waveSize, remaining); i > 0; i--) resolveCards[--remaining]();
				return true;
			},
			end: resolve,
		});
	});
}
