/**
 * Vercel Serverless Function handler.
 *
 * Uses Vercel's native Web Standard API: the handler receives a Web Request
 * and returns a Web Response. No Node.js (req, res) conversion needed.
 *
 * Same-origin fetch short-circuiting is handled at the framework level
 * by patch_global_fetch in @ripple-ts/adapter — server-side fetch() calls
 * that resolve to the same origin are routed directly through the handler
 * in-process.
 */
import { handler } from '../dist/server/entry.js';

export default {
	/** @param {Request} request */
	async fetch(request) {
		try {
			return await handler(request);
		} catch (err) {
			console.error('[ripple] Serverless handler error:', err);
			return new Response('Internal Server Error', { status: 500 });
		}
	},
};
