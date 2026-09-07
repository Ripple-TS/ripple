import { createElement } from 'inferno-create-element';
import { streamQueueAsString } from 'inferno-server';
import { Transform } from 'node:stream';
import { App } from './App.jsx';
import { makeCards, type Scenario } from './data';

export const streaming = true;

export function createBenchmarkStream(scenario: Scenario) {
	let shellReady = false;
	let prefix = '';
	const shellFrame = new Transform({
		transform(chunk, _encoding, callback) {
			const text = chunk.toString();
			if (shellReady) {
				callback(null, text);
				return;
			}
			prefix += text;
			if (prefix.includes('Octane Outfitters')) {
				shellReady = true;
				callback(null, prefix);
				prefix = '';
				return;
			}
			callback();
		},
		flush(callback) {
			callback(null, prefix);
		},
	});
	return streamQueueAsString(createElement(App, { cards: makeCards(scenario) })).pipe(shellFrame);
}

export function renderStream(scenario: Scenario, onChunk: (chunk: string) => void): Promise<void> {
	return new Promise((resolve, reject) => {
		createBenchmarkStream(scenario)
			.on('error', reject)
			.on('data', (chunk) => onChunk(chunk.toString()))
			.on('end', resolve);
	});
}
