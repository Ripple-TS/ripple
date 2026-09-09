import { render, type StreamSink } from 'ripple/server';
import { App, setCards } from './App.tsrx';
import { cardData, makeCards, type CardData, type CardSlot, type Scenario } from './data';

// Streaming SSR entry — Ripple target. Ripple's streaming mode is
// `render(App, { stream })`, where `stream` is any `StreamSink`
// (`{ push, close, error }`): the sync pass pushes the shell (fallbacks
// included), then each settled boundary's resolved output as a framed chunk.
// Like the octane and solid fixtures' plain `{ write, end }` destinations, the
// harness chunk callback plugs in directly as the sink; `createStream()` is
// the same sink wrapped in a web `ReadableStream<Uint8Array>` for HTTP
// responses, which would add a UTF-8 encode/decode round trip the string
// destinations of the other targets do not pay.
export const streaming = true;

export async function renderStream(
	scenario: Scenario,
	onChunk: (chunk: string) => void,
): Promise<void> {
	return renderCards(makeCards(scenario), onChunk);
}

// Same consumer-paced producer as Octane TSRX, using Ripple's native stream
// sink. Each accepted nonempty chunk releases at most one group of pending
// cards.
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
	let closed = false;
	let failure: unknown;
	const sink: StreamSink = {
		push: onChunk,
		close: () => {
			closed = true;
		},
		error: (reason) => {
			failure = reason;
		},
	};
	// `render()` closes the sink before it resolves, so the error check has to
	// come from its result rather than from the sink.
	const result = await render(App, { stream: sink });
	if (failure !== undefined) throw failure;
	if (result.topLevelError) throw result.topLevelError;
	if (!closed) throw new Error('ripple: stream did not close');
}
