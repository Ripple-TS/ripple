/**
 * Vercel Serverless Function handler.
 *
 * Vercel's Node.js runtime calls serverless functions with (IncomingMessage, ServerResponse),
 * but Ripple's production handler expects Web Fetch (Request => Response).
 * This wrapper uses adapter-node's conversion helpers to bridge the two.
 */
import { handler } from '../dist/server/entry.js';
import { nodeRequestToWebRequest, webResponseToNodeResponse } from '@ripple-ts/adapter-node';

export default async function (req, res) {
	const controller = new AbortController();
	req.on('aborted', () => controller.abort());
	res.on('close', () => controller.abort());

	try {
		const request = nodeRequestToWebRequest(req, controller.signal, true);
		const response = await handler(request);
		webResponseToNodeResponse(response, res, req.method ?? 'GET');
	} catch (err) {
		console.error('[ripple] Serverless handler error:', err);
		if (!res.headersSent) {
			res.statusCode = 500;
			res.end('Internal Server Error');
		}
	}
}
