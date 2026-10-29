import { AsyncLocalStorage } from 'node:async_hooks';
import { describe, expect, it } from 'vitest';
import * as devalue from 'devalue';
import { executeServerFunction } from '../../src/runtime/internal/server/rpc.js';
import { read_stream } from '../../src/runtime/internal/client/rpc-stream.js';
import { RpcTransportError } from '../../src/utils/rpc-stream.js';

const encoder = new TextEncoder();
const frame = (seq, kind, data = null) => JSON.stringify([1, seq, kind, data]) + '\n';
function response(text, split = false) {
	const bytes = encoder.encode(text);
	let offset = 0;
	return new Response(
		new ReadableStream({
			pull(controller) {
				if (offset === bytes.length) return controller.close();
				const end = split ? offset + 1 : bytes.length;
				controller.enqueue(bytes.slice(offset, end));
				offset = end;
			},
		}),
	);
}

describe('streaming RPC protocol', () => {
	it('uses backpressure and explicit completion without changing ordinary responses', async () => {
		let pulls = 0;
		let closes = 0;
		const result = await executeServerFunction(async function* () {
			try {
				pulls++;
				yield 'one';
				pulls++;
				yield undefined;
			} finally {
				closes++;
			}
		}, devalue.stringify([]));
		expect(result).toBeInstanceOf(Response);
		expect(pulls).toBe(0);
		const stream = read_stream(result);
		expect(await stream.next()).toEqual({ done: false, value: 'one' });
		expect(pulls).toBe(1);
		expect(await stream.next()).toEqual({ done: false, value: undefined });
		expect(await stream.next()).toEqual({ done: true, value: undefined });
		expect(closes).toBe(1);
		expect(
			devalue.parse(await executeServerFunction(async () => [1, 2], devalue.stringify([]))),
		).toEqual({ value: [1, 2] });
	});

	it('decodes UTF-8 and frame boundaries split across arbitrary chunks', async () => {
		const stream = read_stream(
			response(frame(0, 'v', devalue.stringify('😀\ntext')) + frame(1, 'c'), true),
		);
		expect(await stream.next()).toEqual({ done: false, value: '😀\ntext' });
		expect((await stream.next()).done).toBe(true);
	});

	it('classifies missing completion as interruption, but application failures as terminal', async () => {
		const interrupted = read_stream(response(frame(0, 'v', devalue.stringify(100))));
		expect((await interrupted.next()).value).toBe(100);
		await expect(interrupted.next()).rejects.toBeInstanceOf(RpcTransportError);
		const failed = await executeServerFunction(async function* () {
			yield 100;
			throw new Error('expired cursor');
		}, devalue.stringify([]));
		const reader = read_stream(failed);
		await reader.next();
		await expect(reader.next()).rejects.toMatchObject({ message: 'expired cursor' });
	});

	it.each([
		'[2,0,"c",null]\n',
		'[1,2,"c",null]\n',
		'[1,0,"wrong",null]\n',
		frame(0, 'v', devalue.stringify(1)) + frame(0, 'v', devalue.stringify(2)),
	])('rejects invalid and duplicate frames: %s', async (text) => {
		const reader = read_stream(response(text));
		await expect(
			(async () => {
				for await (const _ of reader) {
				}
			})(),
		).rejects.not.toBeInstanceOf(RpcTransportError);
	});

	it('aborts a blocked next immediately without waiting for generator return', async () => {
		const abort = new AbortController();
		const result = await executeServerFunction(
			async function* () {
				yield 1;
				await new Promise(() => {});
			},
			devalue.stringify([]),
			abort.signal,
		);
		const stream = read_stream(result, abort.signal);
		await stream.next();
		const pending = stream.next();
		abort.abort(new Error('disposed'));
		await expect(pending).rejects.toThrow('disposed');
	});
	it('cancels cooperative upstream work when only the response reader is canceled', async () => {
		const context = new AsyncLocalStorage();
		let signal;
		let started;
		const pulling = new Promise((resolve) => {
			started = resolve;
		});
		let cleaned = false;
		const result = await executeServerFunction(
			async function* () {
				try {
					yield 1;
					signal = context.getStore();
					started();
					await new Promise((_, reject) =>
						signal.addEventListener('abort', () => reject(signal.reason), { once: true }),
					);
				} finally {
					cleaned = true;
				}
			},
			devalue.stringify([]),
			undefined,
			(fn, signal) => context.run(signal, fn),
		);
		const reader = result.body.getReader();
		await reader.read();
		const pending = reader.read();
		await pulling;
		await reader.cancel();
		await pending;
		expect(signal.aborted).toBe(true);
		await new Promise(setImmediate);
		expect(cleaned).toBe(true);
	});
});
