import { encode, revive } from './transport.js';
import { RPC_STREAM_TYPE, RpcTransportError } from '../../../utils/rpc-stream.js';

/**
 * @param {string} hash
 * @param {any[]} args
 * @param {{ s: AbortSignal, r: Set<string> }} [owner]
 */
export async function rpc(hash, args, owner) {
	const signal = owner?.s;
	const body = encode(args);
	/** @type {Response} */
	let response;

	try {
		response = await fetch('/_$_ripple_rpc_$_/' + hash, {
			method: 'POST',
			signal,
			headers: {
				'Content-Type': 'application/json',
			},
			body,
		});
	} catch (err) {
		if (signal?.aborted) throw signal.reason;
		if (owner?.r.has(hash)) throw new RpcTransportError('RPC request interrupted', { cause: err });
		throw new Error('An error occurred while trying to call the server function.', { cause: err });
	}

	if (!response.ok) {
		if (owner?.r.has(hash) && [502, 503, 504].includes(response.status)) {
			void response.body?.cancel().catch(() => {});
			throw new RpcTransportError('RPC service interrupted');
		}
		let message = `Server function call failed with status ${response.status}`;
		let error_body;
		try {
			error_body = await response.text();
		} catch {
			// ignore parse errors, use default message
		}

		if (error_body) {
			try {
				const parsed = JSON.parse(error_body);

				if (parsed && typeof parsed.error === 'string' && parsed.error.length > 0) {
					message = parsed.error;
				} else {
					message = error_body;
				}
			} catch {
				message = error_body;
			}
		}

		throw new Error(message);
	}

	if (response.headers.get('Content-Type') === RPC_STREAM_TYPE) {
		owner?.r.add(hash);
		const { read_stream } = await import('./rpc-stream.js');
		return read_stream(response, signal);
	}

	const data = await response.text();

	if (data === '') {
		throw new Error(
			'The server function end-point did not return a response. Are you running a Ripple server?',
		);
	}

	return revive(data).value;
}
