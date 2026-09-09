// Shared product-page dataset + delay schedule for the streaming-ssr bench.
// This file is byte-identical across the six targets (octane / react / preact /
// solid / ripple / inferno) so every framework streams the same DOM shape on the
// same clock — only the framework glue in App.tsrx / entry-server.ts differs.

export interface CardItem {
	label: string;
	value: string;
}

export interface CardData {
	id: number;
	title: string;
	subtitle: string;
	tag: string;
	note: string;
	items: CardItem[];
}

export interface CardSlot {
	id: number;
	promise: Promise<CardData>;
}

export type Scenario = 'staggered' | 'all-fast';

export const CARD_COUNT = 10;
export const ITEMS_PER_CARD = 5;

// Deterministic per-boundary resolve schedule. `staggered` emulates ten
// independent data sources answering at 5ms, 10ms, …, 50ms; `all-fast` resolves
// everything ~1ms after the render starts, so per-chunk framework overhead (not
// data latency) dominates the render.
export function delayFor(scenario: Scenario, i: number): number {
	return scenario === 'staggered' ? (i + 1) * 5 : 1;
}

const WORDS = ['alpha', 'humming', 'granite', 'copper', 'meadow', 'zephyr', 'cinder', 'lattice'];

// Pure function of the card index — every render (and every framework) sees the
// exact same payload, so streamed bodies are comparable byte-for-byte modulo
// each framework's hydration markers.
export function cardData(i: number): CardData {
	const items: CardItem[] = [];
	for (let k = 0; k < ITEMS_PER_CARD; k++) {
		items.push({
			label: WORDS[(i + k) % WORDS.length] + ' spec ' + k,
			value: 'value ' + ((i * 31 + k * 7) % 97),
		});
	}
	return {
		id: i,
		title: 'Card ' + i + ' — ' + WORDS[i % WORDS.length],
		subtitle: 'Streamed product card number ' + i,
		tag: 'tag-' + (i % 4),
		note: 'batch ' + ((i * 13) % 5) + ' / row ' + i,
		items,
	};
}

// Called ONCE per render, before the framework render starts: all ten data
// promises start their clock at t0, exactly like ten parallel backend requests
// fired when the request arrives. (Never create these inside a component —
// octane's per-round re-pass would restart the schedule.)
//
// Each card resolves once the clock passes t0 + its delay, checked on a
// `setImmediate` chain (one check per event-loop turn, ~µs resolution) rather
// than a `setTimeout`. Node timers expire on the event loop's millisecond-floored
// clock and the poll phase sleeps whole milliseconds from when it is entered, so
// a 1ms timer fires anywhere from ~0 to ~2ms after the call depending on where
// within the millisecond the render started — a phase, not framework work, that
// dominated `totalTime` and favored targets that spend longer before yielding
// to the event loop. The chain gives every target the same arrival time.
export function makeCards(scenario: Scenario): CardSlot[] {
	const t0 = performance.now();
	const pending: Array<{ at: number; resolve: () => void }> = [];
	const cards: CardSlot[] = [];
	for (let i = 0; i < CARD_COUNT; i++) {
		const at = t0 + delayFor(scenario, i);
		cards.push({
			id: i,
			promise: new Promise<CardData>((resolve) => {
				pending.push({ at, resolve: () => resolve(cardData(i)) });
			}),
		});
	}
	const tick = () => {
		const now = performance.now();
		for (let i = pending.length - 1; i >= 0; i--) {
			if (pending[i].at <= now) {
				pending[i].resolve();
				pending.splice(i, 1);
			}
		}
		if (pending.length > 0) setImmediate(tick);
	};
	setImmediate(tick);
	return cards;
}
