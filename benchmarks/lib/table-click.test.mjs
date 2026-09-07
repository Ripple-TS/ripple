import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { timeClick } from '../js-framework/click.mjs';

// Execute the same serialized callback that Playwright sends to the browser,
// with a deterministic clock and a minimal table to isolate the timing boundary.
function fixture({ rows = [], click, flush } = {}) {
	const state = { rows, clockCalls: 0, validationCalls: [] };
	const table = {
		querySelector: () => state.rows[0],
		get rows() {
			state.validationCalls.push(state.clockCalls);
			return state.rows;
		},
	};
	const context = {
		document: {
			querySelector: (selector) => (selector === 'tbody' ? table : { click: () => click(state) }),
		},
		window: { __benchFlush: flush ? () => flush(state) : undefined },
		performance: { now: () => state.clockCalls++ },
	};
	const page = {
		evaluate: (fn, arg) => vm.runInNewContext(`(${fn.toString()})(arg)`, { ...context, arg }),
	};
	return { page, state };
}

test('the timed window includes flushing and excludes DOM validation', async () => {
	const { page, state } = fixture({
		click: () => {},
		flush: (state) => {
			state.rows = Array.from({ length: 1000 }, () => ({}));
		},
	});
	assert.equal(await timeClick(page, { name: 'run' }, '#run'), 1);
	assert.ok(state.validationCalls.every((call) => call === 2));
});

test('a commit deferred until the next turn cannot pass without flushing', async () => {
	const { page } = fixture({
		click: (state) =>
			queueMicrotask(() => {
				state.rows = Array.from({ length: 1000 }, () => ({}));
			}),
	});
	await assert.rejects(
		timeClick(page, { name: 'run' }, '#run'),
		/commit was not inside timed click/,
	);
});

test('the 1k clear diagnostic verifies an empty table after the timer stops', async () => {
	const { page, state } = fixture({
		rows: Array.from({ length: 1000 }, () => ({})),
		click: (state) => {
			state.rows = [];
		},
	});
	assert.equal(await timeClick(page, { name: 'clear_1k' }, '#clear'), 1);
	assert.deepEqual(state.validationCalls, [2]);
});
