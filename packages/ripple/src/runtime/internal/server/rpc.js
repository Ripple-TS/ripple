import * as devalue from 'devalue';
import { transport } from './transport-state.js';
import { is_async_iterable } from '../../../utils/async.js';
import { RPC_STREAM_TYPE, RPC_FRAME_LIMIT } from '../../../utils/rpc-stream.js';

export { setTransport } from './transport-state.js';

/**
 * @param {Function} fn
 * @param {string} rpc_arguments_string
 * @param {AbortSignal} [signal]
 * @param {<T>(fn: () => T, signal?: AbortSignal) => T} [run]
 * @returns {Promise<string | Response>}
 */
export async function executeServerFunction(fn, rpc_arguments_string, signal, run = (fn) => fn()) {
	signal?.throwIfAborted();
	const reducers = transport?.reducers;
	const args = devalue.parse(rpc_arguments_string, transport?.revivers);
	const result = await fn.apply(null, args);
	if (!is_async_iterable(result)) return devalue.stringify({ value: result }, reducers);

	const iterator = result[Symbol.asyncIterator]();
	const abort_controller = new AbortController();
	const encoder = new TextEncoder();
	let sequence = 0;
	let closed = false;
	/** @type {ReadableStreamDefaultController<Uint8Array>} */
	let output;
	function close() {
		if (closed) return;
		closed = true;
		signal?.removeEventListener('abort', abort);
		abort_controller.abort(signal?.reason);
		try {
			Promise.resolve(run(() => iterator.return?.(), abort_controller.signal)).catch(() => {});
		} catch {}
	}
	function abort() {
		if (closed) return;
		close();
		output.error(signal?.reason);
	}
	/** @param {'v' | 'c' | 'e'} kind @param {any} [value] */
	function frame(kind, value) {
		const data = encoder.encode(JSON.stringify([1, sequence++, kind, value]) + '\n');
		if (data.byteLength > RPC_FRAME_LIMIT) throw new Error('RPC stream frame exceeds size limit');
		return data;
	}
	const body = new ReadableStream(
		{
			start(controller) {
				output = controller;
				if (signal?.aborted) abort();
				else signal?.addEventListener('abort', abort, { once: true });
			},
			async pull(controller) {
				try {
					const next = await run(() => iterator.next(), abort_controller.signal);
					if (closed) return;
					controller.enqueue(
						next.done ? frame('c') : frame('v', devalue.stringify(next.value, reducers)),
					);
					if (next.done) {
						closed = true;
						signal?.removeEventListener('abort', abort);
						abort_controller.abort();
						controller.close();
					}
				} catch (error) {
					if (closed) return;
					controller.enqueue(
						frame('e', (error instanceof Error ? error.message : String(error)).slice(0, 1024)),
					);
					close();
					controller.close();
				}
			},
			cancel: close,
		},
		{ highWaterMark: 0 },
	);
	return new Response(body, {
		headers: { 'Content-Type': RPC_STREAM_TYPE, 'Cache-Control': 'no-store' },
	});
}
