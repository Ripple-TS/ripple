import { capture_reviver } from './transport.js';
import { RPC_FRAME_LIMIT, RpcTransportError } from '../../../utils/rpc-stream.js';

/**
 * One response, one owner. Read only enough bytes for the requested next frame.
 * @param {Response} response
 * @param {AbortSignal} [signal]
 * @returns {AsyncIterableIterator<any>}
 */
export function read_stream(response, signal) {
	if (response.body === null) throw new Error('Missing RPC stream body');
	const reader = response.body.getReader();
	const decoder = new TextDecoder('utf-8', { fatal: true });
	const revive = capture_reviver();
	let buffer = '';
	let sequence = 0;
	let closed = false;
	let reading = false;
	function close() {
		if (closed) return;
		closed = true;
		buffer = '';
		signal?.removeEventListener('abort', close);
		void reader.cancel().catch(() => {});
	}
	if (signal?.aborted) close();
	else signal?.addEventListener('abort', close, { once: true });
	return {
		[Symbol.asyncIterator]() {
			return this;
		},
		async next() {
			if (signal?.aborted) throw signal.reason;
			if (closed) return { done: true, value: undefined };
			if (reading) throw new Error('Concurrent RPC stream reads');
			reading = true;
			try {
				let end;
				while ((end = buffer.indexOf('\n')) === -1) {
					let chunk;
					try {
						chunk = await reader.read();
					} catch (error) {
						if (signal?.aborted) throw signal.reason;
						throw new RpcTransportError('RPC stream interrupted', { cause: error });
					}
					if (signal?.aborted) throw signal.reason;
					if (chunk.done) throw new RpcTransportError('RPC stream ended before completion');
					buffer += decoder.decode(chunk.value, { stream: true });
					if (buffer.length > RPC_FRAME_LIMIT)
						throw new Error('RPC stream buffer exceeds size limit');
				}
				const frame = JSON.parse(buffer.slice(0, end));
				buffer = buffer.slice(end + 1);
				if (
					!Array.isArray(frame) ||
					frame.length !== 4 ||
					frame[0] !== 1 ||
					frame[1] !== sequence++
				) {
					throw new Error('Invalid RPC stream frame');
				}
				if (frame[2] === 'v' && typeof frame[3] === 'string') {
					return { done: false, value: revive(frame[3]) };
				}
				if (frame[2] === 'c' && frame[3] === null) {
					if (buffer !== '') throw new Error('RPC frame after completion');
					close();
					return { done: true, value: undefined };
				}
				if (frame[2] === 'e' && typeof frame[3] === 'string') throw new Error(frame[3]);
				throw new Error('Invalid RPC stream frame');
			} catch (error) {
				close();
				throw error;
			} finally {
				reading = false;
			}
		},
		async return() {
			close();
			return { done: true, value: undefined };
		},
	};
}
