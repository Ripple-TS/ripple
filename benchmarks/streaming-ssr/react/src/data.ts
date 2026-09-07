// Shared product-page dataset + delay schedule for the streaming-ssr bench.
// This file is byte-identical across the five targets (octane / react / preact /
// solid / ripple) so every framework streams the same DOM shape on the same
// clock — only the framework glue in App.tsrx / entry-server.ts differs.

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
// everything on a ~1ms timer, so per-chunk framework overhead (not data
// latency) dominates the render.
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
// promises begin their setTimeout at t0, exactly like ten parallel backend
// requests fired when the request arrives. (Never create these inside a
// component — octane's per-round re-pass would restart the timers.)
export function makeCards(scenario: Scenario): CardSlot[] {
	const cards: CardSlot[] = [];
	for (let i = 0; i < CARD_COUNT; i++) {
		const ms = delayFor(scenario, i);
		cards.push({
			id: i,
			promise: new Promise<CardData>((resolve) => {
				setTimeout(() => resolve(cardData(i)), ms);
			}),
		});
	}
	return cards;
}
