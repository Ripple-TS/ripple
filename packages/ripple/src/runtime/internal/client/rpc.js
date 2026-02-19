import * as devalue from 'devalue';

/**
 * @param {string} hash
 * @param {any[]} args
 */
export async function rpc(hash, args) {
	const body = devalue.stringify(args);
	/** @type {Response} */
	let response;

	try {
		response = await fetch('/_$_ripple_rpc_$_/' + hash, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body,
		});
	} catch (err) {
		throw new Error('An error occurred while trying to call the server function.');
	}

	if (!response.ok) {
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

	const data = await response.text();

	if (data === '') {
		throw new Error(
			'The server function end-point did not return a response. Are you running a Ripple server?',
		);
	}

	return devalue.parse(data).value;
}
