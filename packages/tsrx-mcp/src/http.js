import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createTSRXMcpServer } from './server.js';

const DEFAULT_ALLOWED_METHODS = 'GET, POST, DELETE, OPTIONS';
const DEFAULT_ALLOWED_HEADERS = [
	'accept',
	'authorization',
	'content-type',
	'last-event-id',
	'mcp-protocol-version',
	'mcp-session-id',
].join(', ');
const DEFAULT_EXPOSED_HEADERS = ['mcp-session-id', 'mcp-protocol-version'].join(', ');

/**
 * @param {import('node:http').ServerResponse} res
 * @param {{ origin?: string }} [options]
 */
function apply_cors_headers(res, options = {}) {
	res.setHeader('Access-Control-Allow-Origin', options.origin ?? '*');
	res.setHeader('Access-Control-Allow-Methods', DEFAULT_ALLOWED_METHODS);
	res.setHeader('Access-Control-Allow-Headers', DEFAULT_ALLOWED_HEADERS);
	res.setHeader('Access-Control-Expose-Headers', DEFAULT_EXPOSED_HEADERS);
	res.setHeader('Vary', 'Origin');
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 */
function send_json(res, status, body) {
	res.statusCode = status;
	res.setHeader('Content-Type', 'application/json; charset=utf-8');
	res.end(JSON.stringify(body, null, 2));
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {{
 *   cors?: boolean,
 *   corsOrigin?: string,
 *   bearerToken?: string,
 *   enableJsonResponse?: boolean,
 * }} [options]
 */
export async function handleTSRXMcpNodeRequest(req, res, options = {}) {
	if (options.cors !== false) {
		apply_cors_headers(res, { origin: options.corsOrigin });
	}

	if (req.method === 'OPTIONS') {
		res.statusCode = 204;
		res.end();
		return;
	}

	if (options.bearerToken) {
		const authorization = req.headers.authorization;
		if (authorization !== `Bearer ${options.bearerToken}`) {
			send_json(res, 401, {
				error: 'unauthorized',
				message: 'Missing or invalid bearer token.',
			});
			return;
		}
	}

	if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
		send_json(res, 405, {
			error: 'method_not_allowed',
			message: 'TSRX MCP only accepts GET, POST, DELETE, and OPTIONS requests.',
		});
		return;
	}

	const server = createTSRXMcpServer({ remote: true });
	const transport = new StreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: options.enableJsonResponse ?? true,
	});

	try {
		await server.connect(transport);
		await transport.handleRequest(req, res);
	} catch (error) {
		if (!res.headersSent) {
			send_json(res, 500, {
				error: 'mcp_request_failed',
				message: error instanceof Error ? error.message : String(error),
			});
		} else {
			res.end();
		}
	} finally {
		await server.close().catch(() => {});
	}
}
