import { with_async_owner } from './async-owner.js';
import { RpcTransportError } from '../../../utils/rpc-stream.js';

/**
 * Consume one owned attempt. Closing never waits for a producer blocked in next().
 * Publication authority is revoked synchronously by the owner.
 * @param {AsyncIterable<any>} source
 * @param {() => boolean} current
 * @param {(value: any) => void} publish
 * @param {() => void} complete
 * @param {(error: any) => void} reject
 * @param {() => import('./async-owner.js').AsyncOwner} owner
 * @returns {() => void}
 */
export function consume(source, current, publish, complete, reject, owner) {
	const iterator = source[Symbol.asyncIterator]();
	let closed = false;
	function close() {
		if (closed) return;
		closed = true;
		try {
			Promise.resolve(iterator.return && with_async_owner(owner, iterator.return, iterator)).catch(
				() => {},
			);
		} catch {
			// Cleanup cannot revive a retired attempt.
		}
	}
	(async () => {
		try {
			while (!closed && current()) {
				const result = await with_async_owner(owner, iterator.next, iterator);
				if (closed || !current()) break;
				if (result.done) {
					closed = true;
					complete();
					return;
				}
				publish(result.value);
			}
		} catch (error) {
			if (!closed && current()) reject(error);
		} finally {
			close();
		}
	})();
	return close;
}

/** @param {any} error @param {number} count @param {() => void} resume */
export function retry(error, count, resume) {
	if (!(error instanceof RpcTransportError) || count >= 3) return;
	const timer = setTimeout(resume, 100 * 2 ** count);
	return () => clearTimeout(timer);
}
