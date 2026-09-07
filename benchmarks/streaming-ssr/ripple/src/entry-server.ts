import { render, createStream } from 'ripple/server';
import { App, setCards } from './App.tsrx';
import { cardData, makeCards, type CardData, type CardSlot, type Scenario } from './data';

// Streaming SSR entry — Ripple target. Ripple's streaming mode is
// `render(App, { stream: sink })` with a `createStream()` web
// ReadableStream: the sync pass streams the shell (fallbacks included), then
// each suspended block's resolved output is pushed as it settles. The chunks
// arrive through a reader loop using the current public streaming API.
export const streaming = true;

export async function renderStream(
	scenario: Scenario,
	onChunk: (chunk: string) => void,
): Promise<void> {
	return renderCards(makeCards(scenario), onChunk);
}

// Same consumer-paced producer as Octane TSRX, using Ripple's native Web Stream.
// Each accepted nonempty chunk releases at most one group of pending cards.
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
	return renderCards(cards, (chunk) => {
		onChunk(chunk);
		if (chunk.length === 0) return;
		for (let i = Math.min(waveSize, remaining); i > 0; i--) resolveCards[--remaining]();
	});
}

async function renderCards(cards: CardSlot[], onChunk: (chunk: string) => void): Promise<void> {
	setCards(cards);
	const { stream, sink } = createStream();
	const decoder = new TextDecoder();
	const reader = stream.getReader();
	const pump = (async () => {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			onChunk(decoder.decode(value));
		}
	})();
	const result = await render(App, { stream: sink });
	if (result.topLevelError) throw result.topLevelError;
	await pump;
}
