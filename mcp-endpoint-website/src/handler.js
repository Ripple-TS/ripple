import { handleTSRXMcpNodeRequest } from '@tsrx/mcp';

/**
 * Handle a Node HTTP request for the TSRX MCP endpoint.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
export async function handleRequest(req, res) {
	await handleTSRXMcpNodeRequest(req, res, {
		bearerToken: process.env.TSRX_MCP_BEARER_TOKEN,
		corsOrigin: process.env.TSRX_MCP_CORS_ORIGIN,
	});
}
